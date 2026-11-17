import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, inject, Injector, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { AUTH_CONFIG, AuthConfig, AuthErrorUtilities, AuthService, LoginResult, PasskeyUtilities, SecondFactor } from '@service-soft/ngx-auth/auth';
import { SECOND_FACTOR_CONFIG, SecondFactorCodeRequest, SecondFactorFormComponent, SecondFactorLabels } from '@service-soft/ngx-auth/second-factor';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { InputStringComponent } from '@service-soft/ui/input-string';
import { LinkComponent } from '@service-soft/ui/link';

import { LoginConfig, LoginLabels } from './login-config.model';
import { LOGIN_CONFIG } from './login-config.provider';
import { LoginEnrollmentComponent } from './login-enrollment.component';
import { EnrollmentStep, LoginStep, PasswordChangeStep, SecondFactorStep } from './login-step.model';
import { OtherLogin } from './other-login.model';

/**
 * The login of zibri, for the route of the login: the email and password, then a second factor or a new password
 * when the login waits for one, and the first second factor of a user who has none when their account needs one. Sends
 * the user to the page they wanted, the returnUrl the loggedInGuard adds, or to afterLogin of provideAuth. A refused
 * attempt shows what zibri answered and keeps what the user typed. Its texts come from provideLoginConfig, the two
 * factor methods it asks for and enrolls from provideSecondFactorConfig.
 */
@Component({
    selector: 'ngx-login',
    templateUrl: './login.component.html',
    imports: [
        FormComponent,
        InputStringComponent,
        ButtonComponent,
        LinkComponent,
        RouterLink,
        SecondFactorFormComponent,
        LoginEnrollmentComponent
    ],
    host: {
        class: 'block'
    }
})
export class LoginComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    private readonly authConfig: AuthConfig = inject(AUTH_CONFIG);

    private readonly router: Router = inject(Router);

    private readonly route: ActivatedRoute = inject(ActivatedRoute);

    private readonly injector: Injector = inject(Injector);

    private readonly secondFactorLabels: SecondFactorLabels = inject(SECOND_FACTOR_CONFIG).labels;

    private readonly firstInput: Signal<InputStringComponent | undefined> = viewChild<InputStringComponent>('firstInput');

    private readonly secondFactorForm: Signal<SecondFactorFormComponent | undefined> = viewChild(SecondFactorFormComponent);

    private readonly document: Document = inject(DOCUMENT);

    // a second submit while a request is on its way would spend the ticket twice.
    private submitting: boolean = false;

    // the page the user wanted before they left to log in at a provider.
    private providerReturnUrl: string | undefined = undefined;

    /**
     * How the login looks and works.
     */
    protected readonly config: LoginConfig = inject(LOGIN_CONFIG);

    /**
     * The texts of the login.
     */
    protected readonly labels: LoginLabels = this.config.labels;

    /**
     * What the login shows.
     */
    protected readonly step: WritableSignal<LoginStep> = signal<LoginStep>({ type: 'credentials' });

    /**
     * The email the user typed.
     */
    protected readonly email: WritableSignal<string> = signal('');

    /**
     * The password the user typed.
     */
    protected readonly password: WritableSignal<string> = signal('');

    /**
     * The new password the user typed.
     */
    protected readonly newPassword: WritableSignal<string> = signal('');

    /**
     * What zibri answered the last refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last action did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    /**
     * The heading of the current step.
     */
    protected readonly title: Signal<string> = computed(() => {
        switch (this.step().type) {
            case 'credentials': {
                return this.labels.title;
            }
            case 'secondFactor': {
                return this.labels.secondFactorTitle;
            }
            case 'enrollment': {
                return this.labels.enrollmentTitle;
            }
            case 'passwordChange': {
                return this.labels.passwordChangeTitle;
            }
        }
    });

    /**
     * Says why the user is asked what the current step asks for, or undefined when the heading says it.
     */
    protected readonly message: Signal<string | undefined> = computed(() => {
        const step: LoginStep = this.step();
        if (step.type === 'passwordChange') {
            return this.labels.passwordChangeMessage;
        }
        return step.type === 'secondFactor' && step.enrolled ? this.labels.enrolledMessage : undefined;
    });

    /**
     * The other ways to log in: a passkey, and the providers.
     */
    protected readonly otherLogins: OtherLogin[] = [
        ...this.config.passkeyAuthenticator == undefined
            ? []
            : [{ kind: 'passkey' as const, authenticator: this.config.passkeyAuthenticator, label: this.labels.loginWithPasskey }],
        ...this.config.providers.map(provider => ({ kind: 'provider' as const, ...provider }))
    ];

    /**
     * What the browser autofills the email with: the passkeys of the site as well, while there is a passkey login.
     */
    protected readonly emailAutocomplete: string = this.config.passkeyAuthenticator == undefined ? 'username' : 'username webauthn';

    // the request for a passkey of the autofill, which waits while the email shows.
    private autofill: AbortController | undefined;

    /**
     * Whether the user can go back to the email and the password, from every step after it.
     */
    protected readonly canGoBack: Signal<boolean> = computed(() => this.step().type !== 'credentials');

    /**
     * The step while the login waits for a second factor.
     */
    protected readonly secondFactorStep: Signal<SecondFactorStep | undefined> = computed(() => {
        const step: LoginStep = this.step();
        return step.type === 'secondFactor' ? step : undefined;
    });

    /**
     * The step while the user enrolls their first second factor.
     */
    protected readonly enrollmentStep: Signal<EnrollmentStep | undefined> = computed(() => {
        const step: LoginStep = this.step();
        return step.type === 'enrollment' ? step : undefined;
    });

    /**
     * The step while the login waits for a new password.
     */
    protected readonly passwordChangeStep: Signal<PasswordChangeStep | undefined> = computed(() => {
        const step: LoginStep = this.step();
        return step.type === 'passwordChange' ? step : undefined;
    });

    constructor() {
        // only in the browser, which the provider sent back
        afterNextRender(() => void this.completeProviderLogin());
        inject(DestroyRef).onDestroy(() => this.stopPasskeyAutofill());
    }

    /**
     * Logs in with the email and the password.
     */
    protected async login(): Promise<void> {
        this.stopPasskeyAutofill();
        const done: boolean = await this.run(async () => {
            await this.continueWith(await this.authService.login({ email: this.email(), password: this.password() }));
        });
        // a refused attempt stays at the email, whose autofill waits again
        if (!done) {
            this.startPasskeyAutofill();
        }
    }

    /**
     * Logs in with a passkey of the device, or sends the browser to log in at a provider.
     * @param other - The way to log in.
     */
    protected async loginOtherwise(other: OtherLogin): Promise<void> {
        // the browser refuses a dialog for a passkey while the autofill waits for one
        this.stopPasskeyAutofill();
        const done: boolean = await this.run(async () => {
            if (other.kind === 'passkey') {
                await this.continueWith(await this.authService.loginWithPasskey(other.authenticator));
                return;
            }
            // back to this route, which completes the login with the code
            const redirectTo: string = new URL(this.authConfig.routes.login, this.document.baseURI).href;
            const returnUrl: string | undefined = this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined;
            await this.authService.startProviderLogin(other.authenticator, redirectTo, returnUrl, other.apiScopes);
        });
        if (!done) {
            this.startPasskeyAutofill();
        }
    }

    /**
     * Continues the login with a passkey as its second factor.
     * @param step - The step of the login.
     * @param method - The name of the passkey method.
     */
    protected async confirmPasskey(step: SecondFactorStep, method: string): Promise<void> {
        await this.run(async () => {
            const secondFactor: SecondFactor = await this.authService.resolvePasskeySecondFactor(method, step.ticket);
            await this.continueWith(await this.authService.confirmSecondFactorAtLogin(step.ticket, secondFactor));
        });
    }

    /**
     * Continues the login with a second factor.
     * @param step - The step of the login.
     * @param secondFactor - The second factor the user typed.
     */
    protected async confirmSecondFactor(step: SecondFactorStep, secondFactor: SecondFactor): Promise<void> {
        await this.run(async () => await this.continueWith(await this.authService.confirmSecondFactorAtLogin(step.ticket, secondFactor)));
    }

    /**
     * Has zibri send the code of a method, like by email.
     * @param step - The step of the login.
     * @param request - The method, and whether the user asked for a new code.
     */
    protected async sendCode(step: SecondFactorStep, request: SecondFactorCodeRequest): Promise<void> {
        await this.run(async () => {
            await this.authService.requestSecondFactorAtLogin(step.ticket, request.method);
            this.status.set(request.again ? this.secondFactorLabels.newCodeSent : this.secondFactorLabels.codeSent);
        });
    }

    /**
     * Goes on once the user enrolled their first second factor, which completes the login.
     * @param result - Where the login stands.
     */
    protected async finishEnrollment(result: LoginResult): Promise<void> {
        if (result.type === 'secondFactorRequired') {
            // zibri only enrolled the method, so the login waits for its next code
            this.show({ type: 'secondFactor', ticket: result.ticket, methods: result.methods, enrolled: true });
            return;
        }
        await this.run(async () => await this.continueWith(result));
    }

    /**
     * Continues the login with a new password.
     * @param step - The step of the login.
     */
    protected async changePassword(step: PasswordChangeStep): Promise<void> {
        await this.run(async () => await this.continueWith(await this.authService.changePasswordAtLogin(step.ticket, this.newPassword())));
    }

    /**
     * Goes back to the email and the password, like when the ticket of the login ran out.
     */
    protected back(): void {
        this.show({ type: 'credentials' });
    }

    private async continueWith(result: LoginResult): Promise<void> {
        switch (result.type) {
            case 'loggedIn': {
                // the router only navigates inside the app, so a returnUrl can't send the user to another site
                const returnUrl: string | undefined = this.route.snapshot.queryParamMap.get('returnUrl') ?? this.providerReturnUrl;
                await this.router.navigateByUrl(returnUrl ?? this.authConfig.routes.afterLogin);
                return;
            }
            case 'secondFactorRequired': {
                // no methods: the account needs a second factor, and the user has none yet
                this.show(result.methods.length
                    ? { type: 'secondFactor', ticket: result.ticket, methods: result.methods, enrolled: false }
                    : { type: 'enrollment', ticket: result.ticket });
                return;
            }
            case 'passwordChangeRequired': {
                this.show({ type: 'passwordChange', ticket: result.ticket });
                return;
            }
        }
    }

    // asks for a passkey of the autofill while the email shows, if the browser offers them there. It waits until the
    // user picks one, which logs in, or until it is stopped.
    private startPasskeyAutofill(): void {
        const authenticator: string | undefined = this.config.passkeyAuthenticator;
        if (authenticator == undefined || this.autofill != undefined || this.step().type !== 'credentials') {
            return;
        }
        const controller: AbortController = new AbortController();
        this.autofill = controller;
        void this.loginWithPasskeyAutofill(authenticator, controller);
    }

    private async loginWithPasskeyAutofill(authenticator: string, controller: AbortController): Promise<void> {
        if (!await PasskeyUtilities.isAutofillAvailable()) {
            return;
        }
        let result: LoginResult;
        try {
            result = await this.authService.loginWithPasskeyAutofill(controller.signal, authenticator);
        }
        catch (error) {
            // stopped for another way to log in, or cancelled on purpose
            if (!PasskeyUtilities.isCancelled(error)) {
                this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
            }
            return;
        }
        finally {
            if (this.autofill === controller) {
                this.autofill = undefined;
            }
        }
        await this.run(async () => await this.continueWith(result));
    }

    private stopPasskeyAutofill(): void {
        this.autofill?.abort();
        this.autofill = undefined;
    }

    // the browser came back from a provider with the code of the login, which works once
    private async completeProviderLogin(): Promise<void> {
        const code: string | null = this.route.snapshot.queryParamMap.get('code');
        if (code == undefined) {
            this.startPasskeyAutofill();
            return;
        }
        this.providerReturnUrl = this.authService.findPendingProviderLogin()?.returnUrl;
        // a reload of the page would send the spent code again. The router only removes a query param set to null
        // eslint-disable-next-line unicorn/no-null
        const withoutCode: Params = { code: null };
        await this.router.navigate([], {
            relativeTo: this.route,
            queryParams: withoutCode,
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
        await this.run(async () => await this.continueWith(await this.authService.completeProviderLogin(code)));
    }

    private show(step: LoginStep): void {
        this.step.set(step);
        this.newPassword.set('');
        this.errorParagraphs.set([]);
        this.status.set('');
        // the button the user pressed is gone, and the focus with it
        afterNextRender(() => (this.secondFactorForm() ?? this.firstInput())?.focus(), { injector: this.injector });
        // the autofill of the email only matters while it shows
        if (step.type === 'credentials') {
            this.startPasskeyAutofill();
        }
        else {
            this.stopPasskeyAutofill();
        }
    }

    // whether the work ran through, rather than failing or waiting for another one.
    private async run(work: () => Promise<void>): Promise<boolean> {
        if (this.submitting) {
            return false;
        }
        this.submitting = true;
        this.errorParagraphs.set([]);
        try {
            await work();
            return true;
        }
        catch (error) {
            // the user cancelled a passkey on purpose
            if (!PasskeyUtilities.isCancelled(error)) {
                this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
            }
            return false;
        }
        finally {
            this.submitting = false;
        }
    }
}
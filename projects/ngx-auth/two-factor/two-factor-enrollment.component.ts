import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, InputSignal, output, OutputEmitterRef, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { AuthErrorUtilities, AuthService, LoginResult, PasskeyUtilities } from '@service-soft/ngx-auth/auth';
import { SECOND_FACTOR_CONFIG, SecondFactorConfig, SecondFactorLabels, TwoFactorEnrollmentKind } from '@service-soft/ngx-auth/second-factor';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { InputMode, InputStringComponent } from '@service-soft/ui/input-string';
import { OtpRegistration, RecoveryCodeRegistration } from 'zibri-contract';

import { TwoFactorLabels } from './two-factor-config.model';
import { TWO_FACTOR_CONFIG } from './two-factor-config.provider';
import { TwoFactorEnrollmentDetailsComponent } from './two-factor-enrollment-details.component';
import { TwoFactorEnrollmentResult } from './two-factor-enrollment-result.model';
import { TwoFactorEnrollmentStep } from './two-factor-enrollment-step.type';

/**
 * What zibri answers when the enrollment of a method starts, which the user is shown.
 */
type TwoFactorRegistration = OtpRegistration | RecoveryCodeRegistration;

/**
 * Enrolls a two factor method: shows the qr code of an authenticator app, sends the first code by email or text
 * message, or shows the recovery codes to save, and then turns the method on with its first code. With a ticket, it
 * enrolls the first method of a login that waits for one, otherwise one of the logged in user. Which method works how,
 * and the texts of the methods, come from provideSecondFactorConfig, its other texts from provideTwoFactorConfig.
 */
@Component({
    selector: 'ngx-two-factor-enrollment',
    templateUrl: './two-factor-enrollment.component.html',
    imports: [FormComponent, InputStringComponent, ButtonComponent, TwoFactorEnrollmentDetailsComponent],
    host: {
        class: 'block'
    }
})
export class TwoFactorEnrollmentComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    private readonly secondFactorConfig: SecondFactorConfig = inject(SECOND_FACTOR_CONFIG);

    private readonly injector: Injector = inject(Injector);

    private readonly firstInput: Signal<InputStringComponent | undefined> = viewChild(InputStringComponent);

    // the element, not the button component on it
    private readonly passkeyButton: Signal<ElementRef<HTMLElement> | undefined> = viewChild(
        'passkeyButton',
        { read: ElementRef<HTMLElement> }
    );

    // a second submit while a request is on its way would send it twice.
    private sending: boolean = false;

    /**
     * The texts of the enrollment.
     */
    protected readonly labels: TwoFactorLabels = inject(TWO_FACTOR_CONFIG).labels;

    /**
     * The texts of the methods and the code.
     */
    protected readonly secondFactorLabels: SecondFactorLabels = this.secondFactorConfig.labels;

    /**
     * The name of the method to enroll, like 'otp'.
     */
    readonly method: InputSignal<string> = input.required<string>();

    /**
     * The ticket of a login that waits for its first second factor, which the enrollment is for. Without it, the
     * enrollment is for the logged in user.
     */
    readonly ticket: InputSignal<string | undefined> = input<string>();

    /**
     * The name the device lists a passkey under, like the email of the account. The email of the logged in user when
     * not set.
     */
    readonly passkeyName: InputSignal<string | undefined> = input<string>();

    /**
     * Emits the method once it is on, and with a ticket where the login stands, which the enrollment completed.
     */
    readonly enrolled: OutputEmitterRef<TwoFactorEnrollmentResult> = output<TwoFactorEnrollmentResult>();

    /**
     * Where the enrollment stands.
     */
    protected readonly step: WritableSignal<TwoFactorEnrollmentStep> = signal('requesting');

    /**
     * What zibri answered when the enrollment started, like the qr code of an authenticator app.
     */
    protected readonly registration: WritableSignal<OtpRegistration | RecoveryCodeRegistration | undefined> = signal(undefined);

    // what zibri answered when the enrollment of a passkey started, which the device creates the passkey with.
    private readonly passkeyOptions: WritableSignal<PublicKeyCredentialCreationOptionsJSON | undefined> = signal(undefined);

    /**
     * The phone number the user typed, for codes by text message.
     */
    protected readonly phoneNumber: WritableSignal<string> = signal('');

    /**
     * The code the user typed.
     */
    protected readonly code: WritableSignal<string> = signal('');

    /**
     * What zibri answered the last refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last request did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    /**
     * How the method is enrolled.
     */
    protected readonly kind: Signal<TwoFactorEnrollmentKind | undefined> = computed(() => {
        return this.secondFactorConfig.methods[this.method()]?.enrollment;
    });

    /**
     * Whether zibri sends the code of the method, which the user can have sent again.
     */
    protected readonly sendsCode: Signal<boolean> = computed(() => this.secondFactorConfig.methods[this.method()]?.sendsCode === true);

    /**
     * Says where the user finds the first code.
     */
    protected readonly codeHint: Signal<string | undefined> = computed(() => {
        return this.kind() === 'recoveryCodes' ? this.labels.confirmRecoveryCodes : this.secondFactorLabels.methods[this.method()]?.hint;
    });

    /**
     * The keyboard phones show for the code.
     */
    protected readonly codeInputMode: Signal<InputMode> = computed(() => {
        return this.secondFactorConfig.methods[this.method()]?.numeric === true ? 'numeric' : 'text';
    });

    constructor() {
        // once rendered, so the inputs are set, and only in the browser
        afterNextRender(() => this.begin());
    }

    /**
     * Starts the enrollment, with the phone number of codes by text message.
     */
    protected async start(): Promise<void> {
        await this.run(async () => {
            this.step.set('requesting');
            try {
                if (this.kind() === 'passkey') {
                    // asked for before the user presses the button, which the device needs to be pressed right before
                    this.passkeyOptions.set(await this.request<PublicKeyCredentialCreationOptionsJSON>());
                }
                else {
                    this.registration.set(await this.request<TwoFactorRegistration>());
                }
            }
            catch (error) {
                this.step.set(this.kind() === 'smsCode' ? 'phoneNumber' : 'failed');
                throw error;
            }
            this.show(this.kind() === 'passkey' ? 'passkey' : 'confirming');
            if (this.sendsCode()) {
                this.status.set(this.secondFactorLabels.codeSent);
            }
        });
    }

    /**
     * Has the device create the passkey, which turns the method on.
     */
    protected async createPasskey(): Promise<void> {
        const options: PublicKeyCredentialCreationOptionsJSON | undefined = this.passkeyOptions();
        if (options == undefined) {
            return;
        }
        await this.run(async () => await this.finish({ response: await PasskeyUtilities.resolveAttestation(options) }));
    }

    /**
     * Has a new code sent.
     */
    protected async sendCodeAgain(): Promise<void> {
        await this.run(async () => {
            await this.request();
            this.status.set(this.secondFactorLabels.newCodeSent);
        });
    }

    /**
     * Turns the method on with its first code.
     */
    protected async confirm(): Promise<void> {
        // an authenticator app confirms with a token, every other method with a code
        await this.run(async () => await this.finish(this.kind() === 'authenticatorApp' ? { token: this.code() } : { code: this.code() }));
    }

    /**
     * Starts again after zibri refused to start.
     */
    protected begin(): void {
        if (this.kind() === 'smsCode') {
            this.show('phoneNumber');
            return;
        }
        void this.start();
    }

    private async finish(data: object): Promise<void> {
        const ticket: string | undefined = this.ticket();
        let loginResult: LoginResult | undefined = undefined;
        if (ticket == undefined) {
            await this.authService.confirmTwoFactorRegistration(this.method(), data);
        }
        else {
            loginResult = await this.authService.confirmTwoFactorRegistrationAtLogin(ticket, this.method(), data);
        }
        this.status.set(this.labels.turnedOn);
        this.enrolled.emit({ method: this.method(), loginResult });
    }

    private show(step: TwoFactorEnrollmentStep): void {
        this.step.set(step);
        // where the user goes on: the button that started the enrollment may be gone, like the one that picked the method
        afterNextRender(() => {
            const firstInput: InputStringComponent | undefined = this.firstInput();
            if (firstInput == undefined) {
                this.passkeyButton()?.nativeElement.focus();
                return;
            }
            firstInput.focus();
        }, { injector: this.injector });
    }

    private async request<Result>(): Promise<Result | undefined> {
        const data: object | undefined = this.resolveRequestData();
        const ticket: string | undefined = this.ticket();
        return ticket == undefined
            ? await this.authService.requestTwoFactorRegistration<Result>(this.method(), data)
            : await this.authService.requestTwoFactorRegistrationAtLogin<Result>(ticket, this.method(), data);
    }

    // what the method starts with: a text message the phone number, a passkey the name the device lists it under
    private resolveRequestData(): object | undefined {
        switch (this.kind()) {
            case 'smsCode': {
                return { phoneNumber: this.phoneNumber() };
            }
            case 'passkey': {
                return { name: this.passkeyName() ?? this.authService.currentUser()?.email ?? '' };
            }
            case 'authenticatorApp':
            case 'emailCode':
            case 'recoveryCodes':
            case undefined: {
                return undefined;
            }
        }
    }

    private async run(work: () => Promise<void>): Promise<void> {
        if (this.sending) {
            return;
        }
        this.sending = true;
        this.errorParagraphs.set([]);
        this.status.set('');
        try {
            await work();
        }
        catch (error) {
            // the user cancelled a passkey on purpose, and may create it again
            if (!PasskeyUtilities.isCancelled(error)) {
                this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
            }
        }
        finally {
            this.sending = false;
        }
    }
}
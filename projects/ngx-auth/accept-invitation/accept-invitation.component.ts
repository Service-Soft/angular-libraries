import { afterNextRender, Component, computed, ElementRef, inject, Injector, Signal, signal, viewChild, viewChildren, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AUTH_CONFIG, AuthConfig, AuthErrorUtilities, AuthService } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';
import { InvitationTokenValidity } from 'zibri-contract';

import { AcceptInvitationActionView } from './accept-invitation-action-view.model';
import { AcceptInvitationConfig, AcceptInvitationLabels } from './accept-invitation-config.model';
import { ACCEPT_INVITATION_CONFIG } from './accept-invitation-config.provider';
import { AcceptInvitationPasswordComponent } from './accept-invitation-password.component';
import { AcceptInvitationState } from './accept-invitation-state.type';

/**
 * The page the link of an invitation opens, which accepts or declines it. Zibri adds the token to the
 * acceptInvitationUrl of its INVITATION_OPTIONS as the last segment, so its route reads it as the parameter token,
 * without a guard, as accepting works logged out and logged in:
 * `{ path: 'accept-invitation/:token', component: AcceptInvitationComponent }`. It checks the link once it shows in the
 * browser. An invitation that creates its account asks for its password, and leads on to the login. One to an email
 * with an account asks to log in as it, and accepts with one button, after which the user acts in the tenant of the
 * invitation. Its texts come from provideAcceptInvitationConfig.
 */
@Component({
    selector: 'ngx-accept-invitation',
    templateUrl: './accept-invitation.component.html',
    imports: [AcceptInvitationPasswordComponent, ButtonComponent, RouterLink],
    host: {
        class: 'block'
    }
})
export class AcceptInvitationComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    private readonly router: Router = inject(Router);

    private readonly injector: Injector = inject(Injector);

    // the elements, not the button components on them
    private readonly actionLinks: Signal<readonly ElementRef<HTMLElement>[]>
        = viewChildren('actionLink', { read: ElementRef<HTMLElement> });

    private readonly heading: Signal<ElementRef<HTMLElement>> = viewChild.required<ElementRef<HTMLElement>>('heading');

    private readonly token: string | null = inject(ActivatedRoute).snapshot.paramMap.get('token');

    // the outcome of a request, once it was answered: until then the link decides where the page stands.
    private readonly outcome: WritableSignal<'accepted' | 'declined' | undefined> = signal(undefined);

    // a second click while a request is on its way would spend the token twice.
    private sending: boolean = false;

    /**
     * How the page looks and works.
     */
    protected readonly config: AcceptInvitationConfig = inject(ACCEPT_INVITATION_CONFIG);

    /**
     * The texts of the page.
     */
    protected readonly labels: AcceptInvitationLabels = this.config.labels;

    /**
     * What zibri answered about the link, undefined until it did.
     */
    protected readonly validity: WritableSignal<InvitationTokenValidity | undefined> = signal(undefined);

    /**
     * Where the page stands. It follows the login, like a logout in another tab.
     */
    protected readonly state: Signal<AcceptInvitationState> = computed(() => {
        const validity: InvitationTokenValidity | undefined = this.validity();
        const outcome: 'accepted' | 'declined' | undefined = this.outcome();
        if (outcome != undefined) {
            return outcome;
        }
        if (validity == undefined) {
            return 'verifying';
        }
        if (!validity.isValid) {
            return 'invalid';
        }
        if (!validity.requiresLogin) {
            return 'password';
        }
        if (!this.authService.loggedIn()) {
            return 'loginRequired';
        }
        // while GET /me didn't answer, zibri tells whether the login is the one of the email
        const email: string | undefined = this.authService.currentUser()?.email;
        return email == undefined || email.toLowerCase() === validity.email?.toLowerCase() ? 'accept' : 'otherAccount';
    });

    /**
     * Whether the invitation may be declined.
     */
    protected readonly declinable: Signal<boolean> = computed(() => this.validity()?.declinable === true);

    /**
     * What the page says: who is invited, and what stands in the way of accepting.
     */
    protected readonly paragraphs: Signal<string[]> = computed(() => {
        const email: string | undefined = this.validity()?.email;
        const invitedAs: string[] = email == undefined ? [] : [`${this.labels.invitedAs} ${email}`];
        const message: string | undefined = this.resolveMessage(this.state());
        return message == undefined ? invitedAs : [...invitedAs, message];
    });

    /**
     * The links and buttons of where the page stands.
     */
    protected readonly actions: Signal<AcceptInvitationActionView[]> = computed(() => this.resolveActions(this.state()));

    /**
     * What zibri answered a refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last request did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    private readonly routes: AuthConfig['routes'] = inject(AUTH_CONFIG).routes;

    constructor() {
        // only in the browser: a server render would check the token, and show a page the browser checks again
        afterNextRender(() => void this.verify());
    }

    /**
     * Accepts the invitation: with the password of the account it creates, or as the logged in account, which then
     * acts in its tenant.
     * @param password - The password, for an invitation whose validity requires no login.
     */
    protected async accept(password?: string): Promise<void> {
        const validity: InvitationTokenValidity | undefined = this.validity();
        const token: string | null = this.token;
        if (validity == undefined || token == undefined) {
            return;
        }
        await this.send(async () => {
            if (password != undefined) {
                await this.authService.acceptInvitation(token, password);
                return this.labels.acceptedWithPassword;
            }
            await this.authService.acceptInvitation(token);
            // the new membership counts once GET /me answers it
            await this.authService.reloadCurrentUser();
            if (validity.tenantId != undefined) {
                this.authService.setActiveTenant(validity.tenantId);
            }
            return this.labels.accepted;
        }, 'accepted');
    }

    /**
     * Declines the invitation.
     */
    protected async decline(): Promise<void> {
        const token: string | null = this.token;
        if (token == undefined) {
            return;
        }
        await this.send(async () => {
            await this.authService.declineInvitation(token);
            return this.labels.declined;
        }, 'declined');
    }

    private resolveMessage(state: AcceptInvitationState): string | undefined {
        switch (state) {
            case 'invalid': {
                return this.validity()?.renewed === true ? this.labels.renewed : this.labels.invalid;
            }
            case 'loginRequired': {
                return this.labels.loginRequired;
            }
            case 'otherAccount': {
                return this.labels.otherAccount;
            }
            case 'verifying':
            case 'password':
            case 'accept':
            case 'accepted':
            case 'declined': {
                return undefined;
            }
        }
    }

    private resolveActions(state: AcceptInvitationState): AcceptInvitationActionView[] {
        const decline: AcceptInvitationActionView[] = this.declinable()
            ? [{ kind: 'button', label: this.labels.decline, variant: 'outlined', run: async () => await this.decline() }]
            : [];
        switch (state) {
            case 'loginRequired': {
                // read once the link was checked: in the constructor, the router may not have the url of this page yet
                const queryParams: Record<string, string> = { returnUrl: this.router.url };
                return [{ kind: 'link', label: this.labels.login, variant: 'filled', route: this.routes.login, queryParams }, ...decline];
            }
            case 'otherAccount': {
                return [{ kind: 'button', label: this.labels.logout, variant: 'filled', run: async () => await this.logout() }];
            }
            case 'accept': {
                return [{ kind: 'button', label: this.labels.accept, variant: 'filled', run: async () => await this.accept() }, ...decline];
            }
            case 'accepted': {
                // an account with its new password logs in first, a logged in one goes on into the app
                const next: AcceptInvitationActionView = this.validity()?.requiresLogin === false
                    ? { kind: 'link', label: this.labels.login, variant: 'filled', route: this.routes.login }
                    : { kind: 'link', label: this.labels.continue, variant: 'filled', route: this.routes.afterLogin };
                return [next];
            }
            case 'verifying':
            case 'invalid':
            case 'password':
            case 'declined': {
                return [];
            }
        }
    }

    // logs out of the other account, and leads on to the login, which comes back to this page.
    private async logout(): Promise<void> {
        const returnUrl: string = this.router.url;
        await this.authService.logout();
        // beforeLogout of the config may keep the user logged in
        if (!this.authService.loggedIn()) {
            await this.router.navigate([this.routes.login], { queryParams: { returnUrl } });
        }
    }

    private async send(request: () => Promise<string>, outcome: 'accepted' | 'declined'): Promise<void> {
        if (this.sending) {
            return;
        }
        this.sending = true;
        this.errorParagraphs.set([]);
        try {
            this.status.set(await request());
            this.outcome.set(outcome);
            // the button the user pressed is gone, and the focus with it: to the link on, or to the heading
            afterNextRender(() => (this.actionLinks().at(0) ?? this.heading()).nativeElement.focus(), { injector: this.injector });
        }
        catch (error) {
            this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
        }
        finally {
            this.sending = false;
        }
    }

    private async verify(): Promise<void> {
        if (this.token == undefined) {
            this.validity.set({ isValid: false, renewed: false, requiresLogin: false, declinable: false });
            return;
        }
        try {
            this.validity.set(await this.authService.verifyInvitationToken(this.token));
        }
        catch (error) {
            this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
        }
    }
}
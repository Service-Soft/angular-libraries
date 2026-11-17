import { afterNextRender, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AUTH_CONFIG, AuthConfig, AuthErrorUtilities, AuthService } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';
import { EmailConfirmation } from 'zibri-contract';

import { ConfirmEmailLabels } from './confirm-email-config.model';
import { CONFIRM_EMAIL_CONFIG } from './confirm-email-config.provider';

/**
 * Where the user goes on from the page.
 */
type NextLink = {
    /**
     * The route.
     */
    route: string,
    /**
     * The text of the link.
     */
    label: string
};

/**
 * The page the link of an email of zibri opens, which verifies the email or confirms a change of it. The token is the
 * last segment zibri adds to its confirmEmailUrl, so its route reads it as the parameter token:
 * `{ path: 'verify-email/:token', component: ConfirmEmailComponent }`. It confirms the link once it shows in the
 * browser, and leads on into the app or to the login. Its texts come from provideConfirmEmailConfig.
 */
@Component({
    selector: 'ngx-confirm-email',
    templateUrl: './confirm-email.component.html',
    imports: [ButtonComponent, RouterLink],
    host: {
        class: 'block'
    }
})
export class ConfirmEmailComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    private readonly authConfig: AuthConfig = inject(AUTH_CONFIG);

    private readonly token: string | null = inject(ActivatedRoute).snapshot.paramMap.get('token');

    /**
     * The texts of the page.
     */
    protected readonly labels: ConfirmEmailLabels = inject(CONFIRM_EMAIL_CONFIG).labels;

    /**
     * What following the link did, empty until zibri answered.
     */
    protected readonly message: WritableSignal<string> = signal('');

    /**
     * What zibri answered a refused link with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * Where the user goes on: into the app when they are logged in, otherwise to the login.
     */
    protected readonly next: Signal<NextLink> = computed(() => this.authService.loggedIn()
        ? { route: this.authConfig.routes.afterLogin, label: this.labels.continue }
        : { route: this.authConfig.routes.login, label: this.labels.login });

    constructor() {
        // only in the browser: a server render would spend the token of the link
        afterNextRender(() => void this.confirm());
    }

    private async confirm(): Promise<void> {
        try {
            const confirmation: EmailConfirmation = await this.authService.confirmEmail(this.token ?? '');
            this.message.set(this.resolveMessage(confirmation));
        }
        catch (error) {
            this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
        }
    }

    private resolveMessage(confirmation: EmailConfirmation): string {
        if (confirmation.purpose === 'verification') {
            return this.labels.verified;
        }
        return confirmation.completed ? this.labels.changed : this.labels.waitingForOtherLink;
    }
}
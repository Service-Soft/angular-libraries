import { Component, inject, signal, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AUTH_CONFIG, AuthErrorUtilities, AuthService } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { InputStringComponent } from '@service-soft/ui/input-string';
import { LinkComponent } from '@service-soft/ui/link';

import { RequestPasswordResetLabels } from './request-password-reset-config.model';
import { REQUEST_PASSWORD_RESET_CONFIG } from './request-password-reset-config.provider';

/**
 * The page that has zibri mail a link to reset the password, for the requestPasswordResetRoute of the login. The link
 * opens the ConfirmPasswordResetComponent. Its texts come from provideRequestPasswordResetConfig.
 */
@Component({
    selector: 'ngx-request-password-reset',
    templateUrl: './request-password-reset.component.html',
    imports: [FormComponent, InputStringComponent, ButtonComponent, LinkComponent, RouterLink],
    host: {
        class: 'block'
    }
})
export class RequestPasswordResetComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    // a second submit while the request is on its way would mail a second link.
    private sending: boolean = false;

    /**
     * The texts of the page.
     */
    protected readonly labels: RequestPasswordResetLabels = inject(REQUEST_PASSWORD_RESET_CONFIG).labels;

    /**
     * The route of the login, which the page links back to.
     */
    protected readonly loginRoute: string = inject(AUTH_CONFIG).routes.login;

    /**
     * The email the user typed.
     */
    protected readonly email: WritableSignal<string> = signal('');

    /**
     * What zibri answered a refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last request did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    /**
     * Has zibri mail the link.
     */
    protected async send(): Promise<void> {
        if (this.sending) {
            return;
        }
        this.sending = true;
        this.errorParagraphs.set([]);
        this.status.set('');
        try {
            await this.authService.requestPasswordReset(this.email());
            this.status.set(this.labels.sent);
        }
        catch (error) {
            this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
        }
        finally {
            this.sending = false;
        }
    }
}
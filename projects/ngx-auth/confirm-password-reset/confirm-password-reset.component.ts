import { afterNextRender, Component, ElementRef, inject, Injector, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AUTH_CONFIG, AuthErrorUtilities, AuthService } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { InputStringComponent } from '@service-soft/ui/input-string';

import { ConfirmPasswordResetConfig, ConfirmPasswordResetLabels } from './confirm-password-reset-config.model';
import { CONFIRM_PASSWORD_RESET_CONFIG } from './confirm-password-reset-config.provider';
import { PasswordResetState } from './password-reset-state.type';

/**
 * The page the link of a password reset opens, which sets a new password. Zibri adds the token to the
 * CONFIRM_PASSWORD_RESET_URL as the last segment, so its route reads it as the parameter token:
 * `{ path: 'reset-password/:token', component: ConfirmPasswordResetComponent }`. It checks the link once it shows in the
 * browser, and offers a new one when it doesn't work anymore. Changing the password ends every login of the user.
 * Its texts come from provideConfirmPasswordResetConfig.
 */
@Component({
    selector: 'ngx-confirm-password-reset',
    templateUrl: './confirm-password-reset.component.html',
    imports: [FormComponent, InputStringComponent, ButtonComponent, RouterLink],
    host: {
        class: 'block'
    }
})
export class ConfirmPasswordResetComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    private readonly injector: Injector = inject(Injector);

    // the element, not the button component on it
    private readonly loginLink: Signal<ElementRef<HTMLElement> | undefined> = viewChild('loginLink', { read: ElementRef<HTMLElement> });

    private readonly resetToken: string | null = inject(ActivatedRoute).snapshot.paramMap.get('token');

    // a second submit while the request is on its way would spend the token twice.
    private saving: boolean = false;

    /**
     * How the page looks and works.
     */
    protected readonly config: ConfirmPasswordResetConfig = inject(CONFIRM_PASSWORD_RESET_CONFIG);

    /**
     * The texts of the page.
     */
    protected readonly labels: ConfirmPasswordResetLabels = this.config.labels;

    /**
     * The route of the login, which the page links to once the password was changed.
     */
    protected readonly loginRoute: string = inject(AUTH_CONFIG).routes.login;

    /**
     * Where the page stands.
     */
    protected readonly state: WritableSignal<PasswordResetState> = signal('verifying');

    /**
     * The new password the user typed.
     */
    protected readonly newPassword: WritableSignal<string> = signal('');

    /**
     * What zibri answered a refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last request did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    constructor() {
        // only in the browser: a server render would check the token, and show a page the browser checks again
        afterNextRender(() => void this.verify());
    }

    /**
     * Sets the new password.
     */
    protected async save(): Promise<void> {
        if (this.saving || this.resetToken == undefined) {
            return;
        }
        this.saving = true;
        this.errorParagraphs.set([]);
        try {
            await this.authService.confirmPasswordReset(this.resetToken, this.newPassword());
            this.state.set('changed');
            this.status.set(this.labels.changed);
            // the button the user pressed is gone, and the focus with it
            afterNextRender(() => this.loginLink()?.nativeElement.focus(), { injector: this.injector });
        }
        catch (error) {
            this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
        }
        finally {
            this.saving = false;
        }
    }

    private async verify(): Promise<void> {
        if (this.resetToken == undefined) {
            this.state.set('invalid');
            return;
        }
        try {
            this.state.set(await this.authService.verifyPasswordResetToken(this.resetToken) ? 'valid' : 'invalid');
        }
        catch (error) {
            this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
        }
    }
}
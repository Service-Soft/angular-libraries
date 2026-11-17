import { Component, inject, signal, WritableSignal } from '@angular/core';
import { AuthErrorUtilities, AuthService } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { InputStringComponent } from '@service-soft/ui/input-string';

import { ChangePasswordConfig, ChangePasswordLabels } from './change-password-config.model';
import { CHANGE_PASSWORD_CONFIG } from './change-password-config.provider';

/**
 * The form that changes the password of the logged in user, like on the page of their account. Its heading is a h2,
 * below the heading of that page. Changing the password ends every other login of the user. Its texts come from
 * provideChangePasswordConfig.
 */
@Component({
    selector: 'ngx-change-password',
    templateUrl: './change-password.component.html',
    imports: [FormComponent, InputStringComponent, ButtonComponent],
    host: {
        class: 'block'
    }
})
export class ChangePasswordComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    // a second submit while the request is on its way would send the change twice.
    private saving: boolean = false;

    /**
     * How the form looks and works.
     */
    protected readonly config: ChangePasswordConfig = inject(CHANGE_PASSWORD_CONFIG);

    /**
     * The texts of the form.
     */
    protected readonly labels: ChangePasswordLabels = this.config.labels;

    /**
     * The current password the user typed.
     */
    protected readonly currentPassword: WritableSignal<string> = signal('');

    /**
     * The new password the user typed.
     */
    protected readonly newPassword: WritableSignal<string> = signal('');

    /**
     * Whether the input of the current password shows its error.
     */
    protected readonly currentPasswordErrorShown: WritableSignal<boolean> = signal(false);

    /**
     * Whether the input of the new password shows its error.
     */
    protected readonly newPasswordErrorShown: WritableSignal<boolean> = signal(false);

    /**
     * What zibri answered a refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last request did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    /**
     * Changes the password.
     */
    protected async save(): Promise<void> {
        if (this.saving) {
            return;
        }
        this.saving = true;
        this.errorParagraphs.set([]);
        this.status.set('');
        try {
            await this.authService.changePassword(this.currentPassword(), this.newPassword());
            // empty inputs that still show their errors would say they are required right after a success
            this.currentPassword.set('');
            this.newPassword.set('');
            this.currentPasswordErrorShown.set(false);
            this.newPasswordErrorShown.set(false);
            this.status.set(this.labels.changed);
        }
        catch (error) {
            this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
        }
        finally {
            this.saving = false;
        }
    }
}
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { AuthErrorUtilities, AuthService, PasskeyUtilities, SecondFactor } from '@service-soft/ngx-auth/auth';
import { SECOND_FACTOR_CONFIG, SecondFactorCodeRequest, SecondFactorFormComponent, SecondFactorLabels } from '@service-soft/ngx-auth/second-factor';
import { ButtonComponent } from '@service-soft/ui/button';
import { DIALOG_DATA, DialogRef } from '@service-soft/ui/dialog';

import { TwoFactorLabels } from './two-factor-config.model';
import { TWO_FACTOR_CONFIG } from './two-factor-config.provider';

/**
 * The dialog of the TwoFactorDialogPrompt, which asks for the code of a second factor for a request that needs one.
 * Opened with the methods the user enrolled, and closed with the second factor, or with nothing when the user cancels.
 */
@Component({
    selector: 'ngx-two-factor-dialog',
    templateUrl: './two-factor-dialog.component.html',
    imports: [SecondFactorFormComponent, ButtonComponent]
})
export class TwoFactorDialogComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    /**
     * The dialog, to close it with the second factor.
     */
    protected readonly dialogRef: DialogRef<SecondFactor> = inject<DialogRef<SecondFactor>>(DialogRef);

    /**
     * The two factor methods the user enrolled.
     */
    protected readonly methods: string[] = inject<string[]>(DIALOG_DATA);

    /**
     * The texts of the dialog.
     */
    protected readonly labels: TwoFactorLabels = inject(TWO_FACTOR_CONFIG).labels;

    /**
     * The texts of the code.
     */
    protected readonly secondFactorLabels: SecondFactorLabels = inject(SECOND_FACTOR_CONFIG).labels;

    /**
     * What zibri answered a refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last request did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    /**
     * Has the browser use a passkey, and closes the dialog with it.
     * @param method - The name of the passkey method.
     */
    protected async presentPasskey(method: string): Promise<void> {
        this.errorParagraphs.set([]);
        try {
            this.dialogRef.close(await this.authService.resolvePasskeySecondFactor(method));
        }
        catch (error) {
            // the user cancelled a passkey on purpose, and may pick another method
            if (!PasskeyUtilities.isCancelled(error)) {
                this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
            }
        }
    }

    /**
     * Has zibri send the code of a method, like by email.
     * @param request - The method, and whether the user asked for a new code.
     */
    protected async sendCode(request: SecondFactorCodeRequest): Promise<void> {
        this.errorParagraphs.set([]);
        this.status.set('');
        try {
            await this.authService.requestSecondFactor(request.method);
            this.status.set(request.again ? this.secondFactorLabels.newCodeSent : this.secondFactorLabels.codeSent);
        }
        catch (error) {
            this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
        }
    }
}
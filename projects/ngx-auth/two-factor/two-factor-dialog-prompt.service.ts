import { inject, Service } from '@angular/core';
import { SecondFactor, SecondFactorPrompt } from '@service-soft/ngx-auth/auth';
import { DialogService } from '@service-soft/ui/dialog';

import { TwoFactorDialogComponent } from './two-factor-dialog.component';

/**
 * Asks the user for a second factor in a dialog, when a request needs one. Load it with the secondFactorPrompt of
 * provideAuth, which keeps it out of the bundle until a request needs it:
 * `secondFactorPrompt: () => import('@service-soft/ngx-auth/two-factor').then(m => m.TwoFactorDialogPrompt)`.
 */
@Service()
export class TwoFactorDialogPrompt extends SecondFactorPrompt {
    private readonly dialogService: DialogService = inject(DialogService);

    override async resolveSecondFactor(methods: string[]): Promise<SecondFactor | undefined> {
        return await this.dialogService.open<SecondFactor>(TwoFactorDialogComponent, methods).closed;
    }
}
import { inject, Service } from '@angular/core';
import { CONSENT_DIALOG_CONFIG, ConsentDialogConfig, ConsentUi } from '@service-soft/ngx-tracking/consent';
import { DialogService } from '@service-soft/ui/dialog';
import { SnackbarService } from '@service-soft/ui/snackbar';

import { ConsentDialogComponent } from './consent-dialog.component';

/**
 * Shows the consent with the components of @service-soft/ui: the ConsentDialogComponent in a modal dialog, and the
 * notice about a browser that asked not to be tracked in a snackbar. Load it lazily in provideTrackingConsent:
 * `ui: () => import('@service-soft/ngx-tracking/consent-dialog').then(m => m.ConsentDialogUi)`.
 */
@Service()
export class ConsentDialogUi extends ConsentUi {
    private readonly dialogService: DialogService = inject(DialogService);

    private readonly snackbarService: SnackbarService = inject(SnackbarService);

    private readonly config: ConsentDialogConfig = inject(CONSENT_DIALOG_CONFIG);

    /**
     * Opens the ConsentDialogComponent, which escape doesn't close.
     * @returns A promise that resolves once the user chose and the dialog closed.
     */
    override async openDialog(): Promise<void> {
        await this.dialogService.open(ConsentDialogComponent, undefined, { closeOnEscape: false }).closed;
    }

    /**
     * Shows the doNotTrackNotice of the config in a snackbar.
     */
    override showDoNotTrackNotice(): void {
        this.snackbarService.open(this.config.labels.doNotTrackNotice);
    }
}
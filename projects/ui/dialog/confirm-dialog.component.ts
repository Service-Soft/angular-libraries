import { Component, inject } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';

import { ConfirmDialogData } from './confirm-dialog-data.model';
import { DIALOG_DATA } from './dialog-data.provider';
import { DialogRef } from './dialog-ref.model';

/**
 * A question to confirm or cancel, opened with the DialogService:
 * `dialogService.open<boolean>(ConfirmDialogComponent, data).closed`, which resolves with true when the user
 * confirmed. Cancel gets focus first, so pressing enter right away never does anything that can't be undone.
 */
@Component({
    selector: 'ui-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    imports: [ButtonComponent]
})
export class ConfirmDialogComponent {
    /**
     * What the dialog asks.
     */
    protected readonly data: ConfirmDialogData = inject<ConfirmDialogData>(DIALOG_DATA);

    /**
     * The dialog, to close it with the answer.
     */
    protected readonly dialogRef: DialogRef<boolean> = inject<DialogRef<boolean>>(DialogRef);
}
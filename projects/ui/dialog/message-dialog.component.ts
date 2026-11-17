import { Component, inject } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';

import { DIALOG_DATA } from './dialog-data.provider';
import { DialogRef } from './dialog-ref.model';
import { MessageDialogData } from './message-dialog-data.model';

/**
 * A message the user has to notice, like an error, opened with the DialogService:
 * `dialogService.open(MessageDialogComponent, data)`. It has one button, which closes it, and escape closes it too.
 * For a message the user doesn't have to act on, a snackbar interrupts less.
 */
@Component({
    selector: 'ui-message-dialog',
    templateUrl: './message-dialog.component.html',
    imports: [ButtonComponent]
})
export class MessageDialogComponent {
    /**
     * What the dialog says.
     */
    protected readonly data: MessageDialogData = inject<MessageDialogData>(DIALOG_DATA);

    /**
     * The dialog, to close it.
     */
    protected readonly dialogRef: DialogRef = inject(DialogRef);
}
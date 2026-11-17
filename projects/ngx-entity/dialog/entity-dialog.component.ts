import { Component, inject, Signal, viewChild } from '@angular/core';
import { EntityEditorComponent } from '@service-soft/ngx-entity/editor';
import { UnsavedChangesService } from '@service-soft/ngx-entity/unsaved-changes';
import { DIALOG_DATA, DialogRef } from '@service-soft/ui/dialog';

import { EntityDialogData } from './entity-dialog-data.model';

/**
 * The dialog that creates or edits an entity, with its editor. It closes with the entity the server saved. Internal to
 * the dialogs, see EntityDialogService.
 */
@Component({
    selector: 'ngx-entity-dialog',
    templateUrl: './entity-dialog.component.html',
    imports: [EntityEditorComponent]
})
export class EntityDialogComponent<T extends object> {
    private readonly unsavedChanges: UnsavedChangesService = inject(UnsavedChangesService);

    private readonly editor: Signal<EntityEditorComponent<T>> = viewChild.required<EntityEditorComponent<T>>('editor');

    /**
     * Closes the dialog, with the entity once it is saved.
     */
    protected readonly dialogRef: DialogRef<T> = inject<DialogRef<T>>(DialogRef);

    /**
     * What the dialog got: the service, the entity to edit, and the heading.
     */
    protected readonly data: EntityDialogData<T> = inject<EntityDialogData<T>>(DIALOG_DATA);

    /**
     * Closes the dialog without saving, after asking whether to lose the changes, if there are any.
     */
    protected async cancel(): Promise<void> {
        if (!this.editor().hasUnsavedChanges() || await this.unsavedChanges.askToDiscard()) {
            this.dialogRef.close();
        }
    }
}
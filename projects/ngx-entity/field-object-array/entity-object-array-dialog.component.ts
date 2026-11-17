import { Component, effect, inject, inputBinding, signal, Signal, twoWayBinding, untracked, viewChild, ViewContainerRef, WritableSignal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';
import { DIALOG_DATA, DialogRef } from '@service-soft/ui/dialog';
import { FormComponent } from '@service-soft/ui/form';

import { EntityObjectArrayDialogData } from './entity-object-array-dialog-data.model';

/**
 * The dialog that adds or edits an item of an array of objects, with the fields of its class. It closes with the item
 * once its form is valid, and with nothing on cancel. Internal to the field of the array.
 */
@Component({
    selector: 'ngx-entity-object-array-dialog',
    templateUrl: './entity-object-array-dialog.component.html',
    imports: [FormComponent, ButtonComponent]
})
export class EntityObjectArrayDialogComponent {
    private readonly outlet: Signal<ViewContainerRef> = viewChild.required('outlet', { read: ViewContainerRef });

    /**
     * Closes the dialog, with the item once it is valid.
     */
    protected readonly dialogRef: DialogRef<object> = inject<DialogRef<object>>(DialogRef);

    /**
     * What the dialog got: the form, the class and the values of the item.
     */
    protected readonly data: EntityObjectArrayDialogData = inject<EntityObjectArrayDialogData>(DIALOG_DATA);

    /**
     * The values of the item, which the form changes.
     */
    protected readonly value: WritableSignal<Partial<object>> = signal(this.data.value);

    constructor() {
        // the form comes from the field, which can't import it, so it is created rather than in the template, once.
        effect(() => {
            const outlet: ViewContainerRef = this.outlet();
            untracked(() => outlet.createComponent(this.data.form, {
                bindings: [
                    inputBinding('entity', () => this.data.cls),
                    inputBinding('mode', () => this.data.mode),
                    twoWayBinding('value', this.value)
                ]
            }));
        });
    }
}
import { Type } from '@angular/core';
import { EntityClass } from '@service-soft/ngx-entity/entity';

/**
 * What the dialog of an item of an array of objects gets.
 */
export type EntityObjectArrayDialogData = {
    /**
     * The heading of the dialog.
     */
    title: string,
    /**
     * The component of entity forms, which shows the fields of the item.
     */
    form: Type<unknown>,
    /**
     * The class of the items.
     */
    cls: EntityClass<object>,
    /**
     * Whether the dialog adds an item or edits one, which decides the fields the form leaves out.
     */
    mode: 'create' | 'update',
    /**
     * The values the form starts with.
     */
    value: Partial<object>,
    /**
     * The button that takes the item.
     */
    saveLabel: string,
    /**
     * The button that closes the dialog without it.
     */
    cancelLabel: string
};
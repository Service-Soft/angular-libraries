import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { EntityUtilities } from '@service-soft/ngx-entity/entity';
import { EntityFieldComponent } from '@service-soft/ngx-entity/field';

import { EntityFormChange } from './entity-form-change.model';
import { EntityFormRow } from './entity-form-layout.model';

/**
 * The rows of a tab of an entity form, each a grid of 12 columns. Internal to the form.
 */
@Component({
    selector: 'ngx-entity-form-rows',
    templateUrl: './entity-form-rows.component.html',
    imports: [EntityFieldComponent],
    host: { class: 'flex flex-col gap-2' }
})
export class EntityFormRowsComponent<T extends object> {
    /**
     * The rows.
     */
    readonly rows: InputSignal<EntityFormRow<T>[]> = input.required<EntityFormRow<T>[]>();

    /**
     * The values of the form.
     */
    readonly values: InputSignal<Partial<T>> = input.required<Partial<T>>();

    /**
     * The problems the server found, by the key of their property.
     */
    readonly problems: InputSignal<Partial<Record<string, string>>> = input.required<Partial<Record<string, string>>>();

    /**
     * Emits a value the user changed.
     */
    readonly changed: OutputEmitterRef<EntityFormChange> = output<EntityFormChange>();

    /**
     * Gets the value of a field.
     * @param path - The path of its value, like 'address.city'.
     * @returns Its value.
     */
    protected getValue(path: string): unknown {
        return EntityUtilities.getValueAtPath(this.values(), path);
    }

    /**
     * Gets the values the conditions of a field get: those of the object it is in, else those of the entity.
     * @param path - The path of the object, undefined for the entity itself.
     * @returns The values.
     */
    protected getEntity(path: string | undefined): Partial<object> {
        const values: unknown = path == undefined ? this.values() : EntityUtilities.getValueAtPath(this.values(), path);
        return typeof values === 'object' && values != undefined ? values : {};
    }
}
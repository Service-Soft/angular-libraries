import { Component, computed, Signal } from '@angular/core';
import { EntityUtilities, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { InputOption } from '@service-soft/ui/input';
import { InputSelectComponent } from '@service-soft/ui/input-select';

/**
 * The value of a select: a member of an enum, or one of the fixed objects of an object property.
 */
export type EntitySelectValue = string | number | object;

/**
 * The field of a string or number property with an enum, or of an object property with its display style 'dropdown': a
 * select of the values of the enum or of the objects. A string enum shows its values, a number enum the names of its
 * members, an object the label of its option.
 */
@Component({
    selector: 'ngx-entity-select-field',
    templateUrl: './entity-select-field.component.html',
    imports: [InputSelectComponent],
    host: { class: 'contents' }
})
export class EntitySelectFieldComponent<T extends object> extends BaseEntityFieldDirective<T, EntitySelectValue> {
    /**
     * The options of the select, from the enum or the options of the property.
     */
    protected readonly options: Signal<InputOption<EntitySelectValue>[]> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type === 'string' || metadata.type === 'number') {
            return EntityUtilities.resolveEnumMembers(metadata.enum ?? {});
        }
        if (metadata.type !== 'object') {
            throw this.resolveKindError('string');
        }
        const options: InputOption<object>[] | undefined = typeof metadata.options === 'function'
            ? metadata.options(this.entity())
            : metadata.options;
        return options ?? [];
    });

    /**
     * The value as the select knows it: the option equal to it, since the select compares by identity and an object
     * from the server is a copy.
     */
    protected readonly selectedValue: Signal<EntitySelectValue | undefined> = computed(() => {
        const value: EntitySelectValue | undefined = this.value();
        return this.options().find(option => EntityUtilities.isEqual(option.value, value))?.value ?? value;
    });
}
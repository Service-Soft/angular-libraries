import { Component, computed, Signal } from '@angular/core';
import { DateBound, DatePropertyMetadata, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { InputDateComponent, InputDateType } from '@service-soft/ui/input-date';

/**
 * The field of a date property: a day, or a day and a time of it, between the bounds of the property.
 */
@Component({
    selector: 'ngx-entity-date-field',
    templateUrl: './entity-date-field.component.html',
    imports: [InputDateComponent],
    host: { class: 'contents' }
})
export class EntityDateFieldComponent<T extends object> extends BaseEntityFieldDirective<T, Date> {
    /**
     * What the date property says about itself.
     */
    protected readonly metadata: Signal<DatePropertyMetadata<T>> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type !== 'date') {
            throw this.resolveKindError('date');
        }
        return metadata;
    });

    /**
     * The native type of the input.
     */
    protected readonly type: Signal<InputDateType> = computed(() => {
        return this.metadata().displayStyle === 'datetime' ? 'datetime-local' : 'date';
    });

    /**
     * The earliest date, which may depend on the entity.
     */
    protected readonly min: Signal<Date | undefined> = computed(() => this.resolveBound(this.metadata().after));

    /**
     * The latest date, which may depend on the entity.
     */
    protected readonly max: Signal<Date | undefined> = computed(() => this.resolveBound(this.metadata().before));

    private resolveBound(bound: DateBound<T> | undefined): Date | undefined {
        return typeof bound === 'function' ? bound(this.entity()) : bound;
    }
}
import { Component, computed, inject, Signal } from '@angular/core';
import { DateBound, DateRange, DateRangePropertyMetadata, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { INPUT_CONFIG, InputConfig, InputValidation } from '@service-soft/ui/input';
import { InputDateComponent, InputDateType } from '@service-soft/ui/input-date';

import { EntityDateRangeFieldConfig } from './entity-date-range-field-config.model';
import { ENTITY_DATE_RANGE_FIELD_CONFIG } from './entity-date-range-field-config.provider';

/**
 * A date range while the user enters it, which may lack its start or its end.
 */
export type EntityDateRangeValue = Partial<DateRange>;

/**
 * The field of a date range property: an input for the start and one for the end, which can't come before it, between
 * the bounds of the property. Both or neither: while only one is filled in, the other shows its error.
 */
@Component({
    selector: 'ngx-entity-date-range-field',
    templateUrl: './entity-date-range-field.component.html',
    imports: [InputDateComponent],
    host: { class: 'block' }
})
export class EntityDateRangeFieldComponent<T extends object> extends BaseEntityFieldDirective<T, EntityDateRangeValue> {
    private readonly inputConfig: InputConfig = inject(INPUT_CONFIG);

    /**
     * The texts of the field.
     */
    protected readonly labels: EntityDateRangeFieldConfig = inject(ENTITY_DATE_RANGE_FIELD_CONFIG);

    /**
     * What the date range property says about itself.
     */
    protected readonly metadata: Signal<DateRangePropertyMetadata<T>> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type !== 'dateRange') {
            throw this.resolveKindError('dateRange');
        }
        return metadata;
    });

    /**
     * The native type of the inputs.
     */
    protected readonly type: Signal<InputDateType> = computed(() => {
        return this.metadata().displayStyle === 'datetime' ? 'datetime-local' : 'date';
    });

    /**
     * The earliest start, which may depend on the entity.
     */
    protected readonly min: Signal<Date | undefined> = computed(() => this.resolveBound(this.metadata().after));

    /**
     * The latest end, which may depend on the entity.
     */
    protected readonly max: Signal<Date | undefined> = computed(() => this.resolveBound(this.metadata().before));

    /**
     * The start.
     */
    protected readonly start: Signal<Date | undefined> = computed(() => this.value()?.start);

    /**
     * The end.
     */
    protected readonly end: Signal<Date | undefined> = computed(() => this.value()?.end);

    /**
     * The error of a missing start while there is an end, then the problem of the server.
     * @param start - The start.
     * @returns The error, or undefined when there is none.
     */
    protected readonly startValidation: InputValidation<Date | undefined> = start => this.resolveError(start, this.end());

    /**
     * The error of a missing end while there is a start, then the problem of the server.
     * @param end - The end.
     * @returns The error, or undefined when there is none.
     */
    protected readonly endValidation: InputValidation<Date | undefined> = end => this.resolveError(end, this.start());

    /**
     * Takes the dates of the inputs, nothing while both are empty.
     * @param start - The start.
     * @param end - The end.
     */
    protected change(start: Date | undefined, end: Date | undefined): void {
        this.value.set(start == undefined && end == undefined ? undefined : { start, end });
    }

    private resolveError(date: Date | undefined, other: Date | undefined): string | undefined {
        return date == undefined && other != undefined ? this.inputConfig.errorMessages.valueMissing : this.problemValidation()?.();
    }

    private resolveBound(bound: DateBound<T> | undefined): Date | undefined {
        return typeof bound === 'function' ? bound(this.entity()) : bound;
    }
}
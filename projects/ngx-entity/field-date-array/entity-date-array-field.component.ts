import { Component, computed, inject, LOCALE_ID, signal, Signal, WritableSignal } from '@angular/core';
import { DateArrayItemMetadata, DateBound, DateRange, EntityTextUtilities, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective, ENTITY_ARRAY_FIELD_CONFIG, EntityArrayFieldConfig } from '@service-soft/ngx-entity/field-base';
import { ButtonComponent } from '@service-soft/ui/button';
import { INPUT_CONFIG, InputConfig, InputValidation } from '@service-soft/ui/input';
import { InputDateComponent, InputDateType } from '@service-soft/ui/input-date';
import { LocalTableColumn, LocalTableComponent } from '@service-soft/ui/local-table';

/**
 * An item of an array of dates or date ranges.
 */
export type EntityDateArrayItem = Date | DateRange;

/**
 * The field of an array of dates or date ranges: a table of them, each with a button that removes it, and below it the
 * inputs and the button that add one, between the bounds of the items. A required array needs an item.
 */
@Component({
    selector: 'ngx-entity-date-array-field',
    templateUrl: './entity-date-array-field.component.html',
    imports: [LocalTableComponent, InputDateComponent, ButtonComponent],
    host: { class: 'block' }
})
export class EntityDateArrayFieldComponent<T extends object> extends BaseEntityFieldDirective<T, EntityDateArrayItem[]> {
    private readonly locale: string = inject(LOCALE_ID);

    private readonly inputConfig: InputConfig = inject(INPUT_CONFIG);

    /**
     * The texts of the field.
     */
    protected readonly labels: EntityArrayFieldConfig = inject(ENTITY_ARRAY_FIELD_CONFIG);

    /**
     * What the items of the array say about themselves.
     */
    protected readonly items: Signal<DateArrayItemMetadata<T>> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type !== 'array' || (metadata.items.type !== 'date' && metadata.items.type !== 'dateRange')) {
            throw this.resolveKindError('array');
        }
        return metadata.items;
    });

    /**
     * Whether the items are date ranges.
     */
    protected readonly isRange: Signal<boolean> = computed(() => this.items().type === 'dateRange');

    /**
     * The native type of the inputs.
     */
    protected readonly type: Signal<InputDateType> = computed(() => this.items().displayStyle === 'datetime' ? 'datetime-local' : 'date');

    /**
     * The earliest date, which may depend on the entity.
     */
    protected readonly min: Signal<Date | undefined> = computed(() => this.resolveBound(this.items().after));

    /**
     * The latest date, which may depend on the entity.
     */
    protected readonly max: Signal<Date | undefined> = computed(() => this.resolveBound(this.items().before));

    /**
     * The label of the input of a new date, or of the start of a new range.
     */
    protected readonly startLabel: Signal<string> = computed(() => this.isRange() ? this.labels.startLabel : this.labels.dateLabel);

    /**
     * The date of the item to add, or its start.
     */
    protected readonly start: WritableSignal<Date | undefined> = signal(undefined);

    /**
     * The end of the range to add.
     */
    protected readonly end: WritableSignal<Date | undefined> = signal(undefined);

    /**
     * The items.
     */
    protected readonly rows: Signal<EntityDateArrayItem[]> = computed(() => this.value() ?? []);

    /**
     * The columns of the table: the dates, or the starts and the ends.
     */
    protected readonly columns: Signal<LocalTableColumn<EntityDateArrayItem>[]> = computed(() => {
        const { dateLabel, startLabel, endLabel } = this.labels;
        if (!this.isRange()) {
            return [{ key: 'date', label: dateLabel, value: item => this.resolveDateText(item instanceof Date ? item : undefined) }];
        }
        return [
            { key: 'start', label: startLabel, value: item => this.resolveDateText(item instanceof Date ? undefined : item.start) },
            { key: 'end', label: endLabel, value: item => this.resolveDateText(item instanceof Date ? undefined : item.end) }
        ];
    });

    /**
     * Whether the inputs hold an item to add: a date, or a start and an end that doesn't come before it.
     */
    protected readonly canAdd: Signal<boolean> = computed(() => {
        const start: Date | undefined = this.start();
        const end: Date | undefined = this.end();
        return start == undefined ? false : !this.isRange() || (end != undefined && end.getTime() >= start.getTime());
    });

    /**
     * The error of a required array without an item, then the problem of the server, shown at the input that adds one.
     */
    protected readonly validation: InputValidation<Date | undefined> = () => {
        return this.required() && this.rows().length === 0 ? this.inputConfig.errorMessages.valueMissing : this.problemValidation()?.();
    };

    /**
     * Adds the item of the inputs, and empties them for the next one.
     */
    protected add(): void {
        const start: Date | undefined = this.start();
        const end: Date | undefined = this.end();
        if (start == undefined || !this.canAdd()) {
            return;
        }
        const item: EntityDateArrayItem = this.isRange() && end != undefined ? { start, end } : start;
        this.value.set([...this.rows(), item]);
        this.start.set(undefined);
        this.end.set(undefined);
    }

    /**
     * Removes an item.
     * @param item - The item.
     */
    protected remove(item: EntityDateArrayItem): void {
        this.value.set(this.rows().filter(candidate => candidate !== item));
        this.showError.set(true);
    }

    /**
     * Resolves the name of the button that removes an item, with its text.
     * @param item - The item.
     * @returns The name.
     */
    protected resolveRemoveLabel(item: EntityDateArrayItem): string {
        return `${this.labels.removeLabel} ${EntityTextUtilities.resolveItemText(this.items(), item, this.labels, this.locale)}`;
    }

    private resolveDateText(date: Date | undefined): string {
        return date == undefined ? '' : EntityTextUtilities.resolveDateText(date, this.items().displayStyle, this.locale);
    }

    private resolveBound(bound: DateBound<T> | undefined): Date | undefined {
        return typeof bound === 'function' ? bound(this.entity()) : bound;
    }
}
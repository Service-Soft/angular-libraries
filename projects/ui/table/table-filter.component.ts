import { Component, computed, inject, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { InputOption } from '@service-soft/ui/input';
import { InputSelectComponent } from '@service-soft/ui/input-select';
import { InputStringComponent } from '@service-soft/ui/input-string';

import { TableColumn } from './table-column.model';
import { TableConfig } from './table-config.model';
import { TABLE_CONFIG } from './table-config.provider';

/**
 * The filter of a column of ui-table, in the popover of its header: a text, or one of a few options. Internal to the
 * table.
 */
@Component({
    selector: 'ui-table-filter',
    templateUrl: './table-filter.component.html',
    imports: [InputStringComponent, InputSelectComponent],
    // text-start: the header of a column aligned to the end would align the text of the controls there too.
    host: { class: 'block text-start' }
})
export class TableFilterComponent<T> {
    private readonly config: TableConfig = inject(TABLE_CONFIG);

    /**
     * The column.
     */
    readonly column: InputSignal<TableColumn<T>> = input.required<TableColumn<T>>();

    /**
     * The value of the filter: the text, or the value of the chosen option.
     */
    readonly value: InputSignal<unknown> = input.required<unknown>();

    /**
     * Emits the value the user filters by, undefined for nothing.
     */
    readonly changed: OutputEmitterRef<unknown> = output<unknown>();

    /**
     * Emits when the user is done, by Enter in a text or by choosing an option.
     */
    readonly done: OutputEmitterRef<void> = output();

    /**
     * The name of the input, with the label of its column.
     */
    protected readonly filterLabel: Signal<string> = computed(() => this.config.filterLabel(this.column().label));

    /**
     * The choice of a select that filters nothing.
     */
    protected readonly allLabel: string = this.config.allLabel;

    /**
     * The text of a text filter.
     */
    protected readonly text: Signal<string> = computed(() => {
        const value: unknown = this.value();
        return typeof value === 'string' ? value : '';
    });

    /**
     * The options of a select filter, none for a text filter.
     */
    protected readonly options: Signal<InputOption<unknown>[]> = computed(() => {
        const filter: TableColumn<T>['filter'] = this.column().filter;
        return filter?.type === 'select' ? filter.options : [];
    });

    /**
     * Takes the text the user typed, nothing for an empty one.
     * @param text - The text.
     */
    protected changeText(text: string): void {
        this.changed.emit(text === '' ? undefined : text);
    }

    /**
     * Is done with the text, on Enter.
     * @param event - The keydown of Enter.
     */
    // closing the popover moves the focus back to its trigger, which the default action of the same Enter would then
    // press and open the popover again.
    protected finishText(event: Event): void {
        event.preventDefault();
        this.done.emit();
    }

    /**
     * Takes the option the user chose, undefined for the empty choice, and is done.
     * @param value - The value of the option.
     */
    protected choose(value: unknown): void {
        this.changed.emit(value);
        this.done.emit();
    }
}
import { booleanAttribute, Component, inject, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef } from '@angular/core';

import { TABLE_CHECKBOX_CLASSES } from './table-classes';
import { TableColumn } from './table-column.model';
import { TableConfig } from './table-config.model';
import { TABLE_CONFIG } from './table-config.provider';
import { TableFilterChange } from './table-filter-change.model';
import { TableFilters } from './table-filters.type';
import { TableHeaderCellComponent } from './table-header-cell.component';
import { TableOrder } from './table-order.model';

/**
 * The row of the headers of ui-table, which order and filter the rows, with the checkbox that selects all of a page. On
 * a phone only the columns to order or filter by show, side by side. Internal to the table.
 */
@Component({
    // on the tr itself, since the head of a table may only hold rows
    selector: 'tr[ui-table-header-row]',
    templateUrl: './table-header-row.component.html',
    imports: [TableHeaderCellComponent],
    host: {
        role: 'row',
        class: 'border-b border-outline-variant max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-2 max-sm:border-0'
    }
})
export class TableHeaderRowComponent<T> {
    private readonly config: TableConfig = inject(TABLE_CONFIG);

    /**
     * The columns of the table.
     */
    readonly columns: InputSignal<TableColumn<T>[]> = input.required<TableColumn<T>[]>();

    /**
     * The order of the table.
     */
    readonly order: InputSignal<TableOrder | undefined> = input.required<TableOrder | undefined>();

    /**
     * The filters of the table, by the key of their column.
     */
    readonly filters: InputSignal<TableFilters> = input.required<TableFilters>();

    /**
     * Whether the rows have checkboxes that select them.
     */
    readonly selectable: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether every row of the page is selected.
     */
    readonly allSelected: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the page has no rows, which leaves nothing to select.
     */
    readonly empty: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether some but not all rows of the page are selected.
     */
    readonly someSelected: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the rows have actions, which get a column of their own.
     */
    readonly hasActions: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Emits the column the user orders the table by.
     */
    readonly sorted: OutputEmitterRef<TableColumn<T>> = output<TableColumn<T>>();

    /**
     * Emits the filter the user changed.
     */
    readonly filtered: OutputEmitterRef<TableFilterChange> = output<TableFilterChange>();

    /**
     * Emits when the user selects or deselects every row of the page.
     */
    readonly toggledAll: OutputEmitterRef<void> = output();

    /**
     * The texts of the table.
     */
    protected readonly labels: TableConfig = this.config;

    /**
     * The tailwind classes of the checkbox.
     */
    protected readonly checkboxClasses: string = TABLE_CHECKBOX_CLASSES;
}
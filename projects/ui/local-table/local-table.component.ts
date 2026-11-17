import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, model, ModelSignal, output, OutputEmitterRef, Signal, TemplateRef } from '@angular/core';
import { TABLE_CONFIG, TableComponent, TableConfig, TableFilters, TableOrder, TableRowContext, TableVariant } from '@service-soft/ui/table';

import { LocalTableColumn } from './local-table-column.model';
import { LocalTableUtilities } from './local-table.utilities';

/**
 * A ui-table that gets all of its rows at once, and orders, filters and pages them itself, like a list the app already
 * has in full. For rows a backend answers in pages, use ui-table.
 * The page, the order, the filters and the selection can be bound two-way, to keep them, but don't have to be.
 * Like in ui-table, the ui-table-actions you put inside of it show next to its label, and everything else below it.
 */
@Component({
    selector: 'ui-local-table',
    templateUrl: './local-table.component.html',
    imports: [TableComponent],
    host: { class: 'block' }
})
export class LocalTableComponent<T> {
    private readonly config: TableConfig = inject(TABLE_CONFIG);

    /**
     * What the table shows, like 'Customers'. It shows above the table, which screen readers say on entering it.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * Whether the label is only read by screen readers, like when a heading above the table says the same already.
     */
    readonly hideLabel: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether its label is marked as required, like a table of the items of a form that needs at least one.
     */
    readonly required: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether its frame shows in the error color, like an invalid input. Say what is wrong in a text as well, the color
     * alone doesn't for everyone.
     */
    readonly invalid: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The columns.
     */
    readonly columns: InputSignal<LocalTableColumn<T>[]> = input.required<LocalTableColumn<T>[]>();

    /**
     * All rows.
     */
    readonly rows: InputSignal<T[]> = input.required<T[]>();

    /**
     * How many rows a page has. The user changes it below the table, bind it with [(pageSize)].
     */
    readonly pageSize: ModelSignal<number> = model(this.config.pageSize);

    /**
     * The page sizes the user can choose from below the table. The current page size is always one of them.
     */
    readonly pageSizes: InputSignal<number[]> = input(this.config.pageSizes);

    /**
     * How the table is set apart from what is around it: flat, outlined or a card.
     */
    readonly variant: InputSignal<TableVariant> = input<TableVariant>(this.config.variant);

    /**
     * Whether every second row has a slightly different background, which helps reading along wide rows.
     */
    readonly striped: InputSignalWithTransform<boolean, unknown> = input(this.config.striped, { transform: booleanAttribute });

    /**
     * What identifies a row, which keeps it selected while it is replaced, like its id. The row itself by default.
     */
    readonly rowKey: InputSignal<(row: T) => unknown> = input<(row: T) => unknown>(row => row);

    /**
     * Whether the rows have checkboxes that select them.
     */
    readonly selectable: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the rows open, which says so through opened.
     */
    readonly opens: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The template of the actions of a row, like a menu. It gets the row as `let-row`.
     */
    readonly actions: InputSignal<TemplateRef<TableRowContext<T>> | undefined> = input<TemplateRef<TableRowContext<T>>>();

    /**
     * Whether the rows load. A spinner covers the rows until then, which can't be used meanwhile, and screen readers
     * wait for the table.
     */
    readonly loading: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The current page, from 1 on.
     */
    readonly page: ModelSignal<number> = model(1);

    /**
     * The order of the rows, none by default.
     */
    readonly order: ModelSignal<TableOrder | undefined> = model<TableOrder>();

    /**
     * The filters of the rows, by the key of their column.
     */
    readonly filters: ModelSignal<TableFilters> = model<TableFilters>({});

    /**
     * The selected rows.
     */
    readonly selected: ModelSignal<T[]> = model<T[]>([]);

    /**
     * Emits the row the user opens.
     */
    readonly opened: OutputEmitterRef<T> = output<T>();

    /**
     * The rows that pass the filters.
     */
    protected readonly matching: Signal<T[]> = computed(() => {
        return LocalTableUtilities.findMatchingRows(this.rows(), this.columns(), this.filters());
    });

    /**
     * The page that shows: the current one, or the last one once fewer rows are left, like after deleting the last row
     * of the last page.
     */
    protected readonly shownPage: Signal<number> = computed(() => {
        return Math.max(1, Math.min(this.page(), Math.ceil(this.matching().length / this.pageSize())));
    });

    /**
     * The rows of the page that shows, in order.
     */
    protected readonly pageRows: Signal<T[]> = computed(() => {
        const start: number = (this.shownPage() - 1) * this.pageSize();
        return LocalTableUtilities.resolveOrderedRows(this.matching(), this.columns(), this.order()).slice(start, start + this.pageSize());
    });
}
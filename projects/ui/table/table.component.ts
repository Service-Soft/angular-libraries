import { afterNextRender, booleanAttribute, Component, computed, ElementRef, inject, Injector, input, InputSignal, InputSignalWithTransform, model, ModelSignal, output, OutputEmitterRef, Signal, TemplateRef, viewChild } from '@angular/core';
import { EmptyStateComponent, EmptyStateVariant } from '@service-soft/ui/empty-state';
import { SpinnerComponent } from '@service-soft/ui/spinner';

import { TableActiveFilter } from './table-active-filter.model';
import { TableColumn } from './table-column.model';
import { TableConfig } from './table-config.model';
import { TABLE_CONFIG } from './table-config.provider';
import { TableFilterChange } from './table-filter-change.model';
import { TableFilters } from './table-filters.type';
import { TableFooterComponent } from './table-footer.component';
import { TableHeaderRowComponent } from './table-header-row.component';
import { TableLabelRowComponent } from './table-label-row.component';
import { TableOrder } from './table-order.model';
import { TableRowContext } from './table-row-context.model';
import { TableRowComponent } from './table-row.component';
import { TableVariant } from './table-variant.type';

let nextId: number = 0;

// the host is the frame of the header, the rows and the footer. A framed table leaves the line below the last row to
// its frame or footer, except on a phone, where every row is a card with a border of its own. The card has a
// transparent border, which draws it in forced colors mode, where shadows and backgrounds are gone.
const VARIANT_CLASSES: Record<TableVariant, string> = {
    flat: 'block',
    outlined: 'block overflow-hidden rounded-table border border-outline-variant sm:[&_tbody>tr:last-child]:border-b-0',
    card: 'block overflow-hidden rounded-table border border-transparent bg-surface shadow-1 sm:[&_tbody>tr:last-child]:border-b-0'
};

// an invalid table has a frame in the error color, like an invalid input, so a flat one gets one as well. Complete lists
// instead of an added border-error: which of two border colors wins depends on their order in the stylesheet.
const INVALID_VARIANT_CLASSES: Record<TableVariant, string> = {
    flat: 'block overflow-hidden rounded-table border border-error sm:[&_tbody>tr:last-child]:border-b-0',
    outlined: 'block overflow-hidden rounded-table border border-error sm:[&_tbody>tr:last-child]:border-b-0',
    card: 'block overflow-hidden rounded-table border border-error bg-surface shadow-1 sm:[&_tbody>tr:last-child]:border-b-0'
};

// on a phone the cards of the rows keep their distance from the frame, and a flat table only from the header and the
// footer. relative, so the row of the spinner can cover the rows while they load.
const BODY_CLASSES: Record<TableVariant, string> = {
    flat: 'relative max-sm:flex max-sm:flex-col max-sm:gap-3 max-sm:py-3',
    outlined: 'relative max-sm:flex max-sm:flex-col max-sm:gap-3 max-sm:p-3',
    card: 'relative max-sm:flex max-sm:flex-col max-sm:gap-3 max-sm:p-3'
};

// as high as the row it replaces, so the table keeps its height when its last row is removed: a row is as high as its
// text, or as a small button in its actions.
const EMPTY_CELL_CLASSES: Record<'actions' | 'plain', string> = {
    actions: 'h-12 px-3 py-2 text-center text-body text-on-surface-variant max-sm:block',
    plain: 'px-3 py-2 text-center text-body text-on-surface-variant max-sm:block'
};

// the empty state of the table steps back for one of the consumer, which comes right before it. More specific than the
// block of its host, so it wins whatever the order of the two in the stylesheet.
const DEFAULT_EMPTY_STATE_CLASSES: string = '[ui-empty-state+&]:hidden';

// over the rows of the last page, so the table keeps its height while the next one loads, and opaque, as the rows
// under it are no content then. Without rows, the spinner takes the place of the text that says there are none.
const LOADING_ROW_CLASSES: Record<'overlay' | 'empty', string> = {
    overlay: 'absolute inset-0 flex bg-surface',
    empty: 'max-sm:block'
};

const LOADING_CELL_CLASSES: Record<'overlay' | 'empty', string> = {
    overlay: 'flex flex-1 items-center justify-center',
    empty: 'px-3 py-6 text-center max-sm:block'
};

/**
 * A table of rows a page at a time, like the ones a backend answers in pages: the columns come from a config, a column
 * can be ordered by and filtered, and a cell can have a template of its own.
 * The table only says what the user wants, the rows come from you. Bind [(page)], [(pageSize)], [(order)] and
 * [(filters)], load the rows they ask for and give them to rows, with how many there are in total. A changed order or
 * filter goes back to the first page. Below the rows, the table says which of them the page shows, and lets the user
 * choose how many a page has.
 * Rows can be selected, bound with [(selected)], have actions, and open, by their first value or a click anywhere else
 * on them. On a phone every row is a card of its values, each after the label of its column.
 * It is flat, outlined or a card, can stripe its rows, and its header, footer and stripes take their colors from the
 * table tokens of the theme.
 * Its label shows above the rows, with the ui-table-actions you put inside of the table next to it, like a button that
 * creates a row. Everything else you put inside of it, like a description or the inputs that add a row, shows below
 * the label, in the frame of the table.
 */
@Component({
    selector: 'ui-table',
    templateUrl: './table.component.html',
    imports: [
        TableLabelRowComponent,
        TableHeaderRowComponent,
        TableRowComponent,
        TableFooterComponent,
        SpinnerComponent,
        EmptyStateComponent
    ],
    host: { '[class]': 'classes()' }
})
export class TableComponent<T> {
    private readonly config: TableConfig = inject(TABLE_CONFIG);

    /**
     * The id of the table, which the ids of its values start with.
     */
    protected readonly id: string = `ui-table-${nextId++}`;

    /**
     * The id of the label above the table, which names it.
     */
    protected readonly labelId: string = `${this.id}-label`;

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
    readonly columns: InputSignal<TableColumn<T>[]> = input.required<TableColumn<T>[]>();

    /**
     * The rows of the current page.
     */
    readonly rows: InputSignal<T[]> = input.required<T[]>();

    /**
     * How many rows there are on all pages together, like the totalAmount of a page of zibri.
     */
    readonly totalAmount: InputSignal<number> = input.required<number>();

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
     * What identifies a row, which keeps it selected while it is reloaded, like its id. The row itself by default.
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
     * Whether the rows load, like the next page. A spinner covers the rows of the last page until then, which can't be
     * used meanwhile, and screen readers wait for the table.
     */
    readonly loading: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The current page, from 1 on. The user changes it, bind it with [(page)].
     */
    readonly page: ModelSignal<number> = model(1);

    /**
     * The order of the rows, none by default. The user changes it, bind it with [(order)].
     */
    readonly order: ModelSignal<TableOrder | undefined> = model<TableOrder>();

    /**
     * The filters of the rows, by the key of their column. The user changes them, bind them with [(filters)].
     */
    readonly filters: ModelSignal<TableFilters> = model<TableFilters>({});

    /**
     * The selected rows, of every page. The user changes them, bind them with [(selected)].
     */
    readonly selected: ModelSignal<T[]> = model<T[]>([]);

    /**
     * Emits the row the user opens.
     */
    readonly opened: OutputEmitterRef<T> = output<T>();

    /**
     * The texts of the table.
     */
    protected readonly labels: TableConfig = this.config;

    /**
     * The filters that are set, in the order of their columns, for their badges in the footer.
     */
    protected readonly activeFilters: Signal<TableActiveFilter[]> = computed(() => {
        const filters: TableFilters = this.filters();
        return this.columns().flatMap(column => {
            const value: unknown = filters[column.key];
            // a select shows the label of its option, which says what the value means
            const text: unknown = column.filter?.type === 'select'
                ? column.filter.options.find(option => option.value === value)?.label
                : value;
            return typeof text === 'string' ? [{ key: column.key, text: `${column.label}: ${text}` }] : [];
        });
    });

    /**
     * Whether the footer below the rows shows, which holds the pagination, which rows the page shows, the select of the
     * page size and the badges of the filters.
     */
    protected readonly hasFooter: Signal<boolean> = computed(() => this.activeFilters().length > 0 || this.totalAmount() > 0);

    /**
     * The footer, which gets the focus of a removed filter.
     */
    private readonly footer: Signal<TableFooterComponent | undefined> = viewChild(TableFooterComponent);

    private readonly host: ElementRef<HTMLElement> = inject<ElementRef<HTMLElement>>(ElementRef);

    private readonly injector: Injector = inject(Injector);

    /**
     * The tailwind classes of the table, which frame it by its variant and whether it is invalid.
     */
    protected readonly classes: Signal<string> = computed(() => {
        return (this.invalid() ? INVALID_VARIANT_CLASSES : VARIANT_CLASSES)[this.variant()];
    });

    /**
     * The tailwind classes of the body of the rows.
     */
    protected readonly bodyClasses: Signal<string> = computed(() => BODY_CLASSES[this.variant()]);

    /**
     * The tailwind classes of the row of the spinner: over the rows, or in their place while there are none.
     */
    protected readonly loadingRowClasses: Signal<string> = computed(() => LOADING_ROW_CLASSES[this.rows().length ? 'overlay' : 'empty']);

    /**
     * The tailwind classes of the cell of the spinner.
     */
    protected readonly loadingCellClasses: Signal<string> = computed(() => LOADING_CELL_CLASSES[this.rows().length ? 'overlay' : 'empty']);

    /**
     * Whether the rows have actions, which get a column of their own.
     */
    protected readonly hasActions: Signal<boolean> = computed(() => this.actions() != undefined);

    /**
     * The tailwind classes of the cell that says there are no rows.
     */
    protected readonly emptyCellClasses: Signal<string> = computed(() => EMPTY_CELL_CLASSES[this.hasActions() ? 'actions' : 'plain']);

    /**
     * The tailwind classes of the empty state of the table, which hides behind one of the consumer.
     */
    protected readonly defaultEmptyStateClasses: string = DEFAULT_EMPTY_STATE_CLASSES;

    /**
     * Why there are no rows: none at all, or none that match the filters.
     */
    protected readonly emptyVariant: Signal<EmptyStateVariant> = computed(() => this.activeFilters().length ? 'no-results' : 'empty');

    /**
     * How many columns the table has, with the ones of the checkboxes and the actions.
     */
    protected readonly columnCount: Signal<number> = computed(() => {
        return this.columns().length + (this.selectable() ? 1 : 0) + (this.hasActions() ? 1 : 0);
    });

    /**
     * The keys of the selected rows.
     */
    private readonly selectedKeys: Signal<Set<unknown>> = computed(() => new Set(this.selected().map(this.rowKey())));

    /**
     * How many rows of the page are selected.
     */
    private readonly selectedOnPage: Signal<number> = computed(() => this.rows().filter(row => this.isSelected(row)).length);

    /**
     * Whether every row of the page is selected.
     */
    protected readonly allSelected: Signal<boolean> = computed(() => {
        return this.rows().length > 0 && this.selectedOnPage() === this.rows().length;
    });

    /**
     * Whether some but not all rows of the page are selected.
     */
    protected readonly someSelected: Signal<boolean> = computed(() => this.selectedOnPage() > 0 && !this.allSelected());

    /**
     * Gets what identifies a row.
     * @param row - The row.
     * @returns Its key.
     */
    protected getKey(row: T): unknown {
        return this.rowKey()(row);
    }

    /**
     * Whether a row is selected.
     * @param row - The row.
     * @returns True when it is.
     */
    protected isSelected(row: T): boolean {
        return this.selectedKeys().has(this.getKey(row));
    }

    /**
     * Selects a row, or deselects it when it is selected.
     * @param row - The row.
     */
    protected toggle(row: T): void {
        const key: unknown = this.getKey(row);
        this.selected.set(this.isSelected(row)
            ? this.selected().filter(selected => this.getKey(selected) !== key)
            : [...this.selected(), row]);
    }

    /**
     * Deselects every row of the page when all are selected, and selects them otherwise. Rows of other pages stay as
     * they are.
     */
    protected toggleAll(): void {
        if (this.allSelected()) {
            const pageKeys: Set<unknown> = new Set(this.rows().map(this.rowKey()));
            this.selected.set(this.selected().filter(row => !pageKeys.has(this.getKey(row))));
            return;
        }
        this.selected.set([...this.selected(), ...this.rows().filter(row => !this.isSelected(row))]);
    }

    /**
     * Orders by a column ascending, then descending, then not by it, and goes back to the first page.
     * @param column - The column.
     */
    protected sort(column: TableColumn<T>): void {
        const order: TableOrder | undefined = this.order();
        if (order?.key !== column.key) {
            this.order.set({ key: column.key, direction: 'ASC' });
        }
        else {
            this.order.set(order.direction === 'ASC' ? { key: column.key, direction: 'DESC' } : undefined);
        }
        this.page.set(1);
    }

    /**
     * Changes the filter of a column, and goes back to the first page.
     * @param change - The column and what it is filtered by now.
     */
    protected filter(change: TableFilterChange): void {
        const others: TableFilters = Object.fromEntries(Object.entries(this.filters()).filter(([key]) => key !== change.key));
        this.filters.set(change.value == undefined ? others : { ...others, [change.key]: change.value });
        this.page.set(1);
    }

    /**
     * Removes the filter of a badge, and focuses the badge that takes its place, or the one before it. Without one, the
     * button in the header that opens the filter again.
     * @param index - The index of the badge.
     */
    protected removeFilter(index: number): void {
        const key: string | undefined = this.activeFilters()[index]?.key;
        if (key == undefined) {
            return;
        }
        const filterIndex: number = this.columns().filter(column => column.filter != undefined)
            .findIndex(column => column.key === key);
        this.filter({ key, value: undefined });
        afterNextRender(() => {
            if (this.footer()?.focusFilterBadge(index) === true) {
                return;
            }
            // the buttons of the filters in the header are in the order of their columns
            this.host.nativeElement.querySelectorAll<HTMLButtonElement>('thead button[popovertarget]')[filterIndex]?.focus();
        }, { injector: this.injector });
    }
}
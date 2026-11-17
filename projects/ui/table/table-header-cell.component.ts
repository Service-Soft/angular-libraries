import { Component, computed, inject, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { faMagnifyingGlass, faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { PopoverComponent, PopoverTriggerDirective } from '@service-soft/ui/popover';

import { TableColumn } from './table-column.model';
import { TableConfig } from './table-config.model';
import { TABLE_CONFIG } from './table-config.provider';
import { TableFilterComponent } from './table-filter.component';
import { TableOrder } from './table-order.model';

// a column that can neither order nor filter the rows has no use in the header of a phone, where every value shows its
// label.
const HEADER_CELL_CLASSES: Record<'interactive' | 'fixed', Record<'start' | 'end', string>> = {
    interactive: {
        start: 'px-3 py-2 text-start align-bottom text-label font-semibold text-on-surface',
        end: 'px-3 py-2 text-end align-bottom text-label font-semibold text-on-surface'
    },
    fixed: {
        start: 'px-3 py-2 text-start align-bottom text-label font-semibold text-on-surface max-sm:hidden',
        end: 'px-3 py-2 text-end align-bottom text-label font-semibold text-on-surface max-sm:hidden'
    }
};

// the whole header is the target, and the focus ring is offset from it.
const SORT_BUTTON_CLASSES: string = `
    inline-flex min-h-6 cursor-pointer items-center gap-1.5 rounded-button
    hover:text-primary
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
`;

// a small target of 24px around the icon, which the dot of an active filter sits in the corner of.
const FILTER_BUTTON_CLASSES: string = `
    relative ms-1 inline-flex min-h-6 min-w-6 cursor-pointer items-center justify-center rounded-button align-middle
    hover:text-primary
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
`;

// the border draws the dot in forced colors mode, which removes its background. The notice below the table says the
// same in text, so the color is not the only cue.
const FILTER_DOT_CLASSES: string = 'absolute end-0 top-0 size-2 rounded-full border border-transparent bg-primary';

/**
 * The header of a column of ui-table, which orders the rows by it when it is sortable, and has a button that opens its
 * filter in a popover when it has one. Internal to the table.
 */
@Component({
    // on the th itself, since a row of a table may only hold cells
    selector: 'th[ui-table-header-cell]',
    templateUrl: './table-header-cell.component.html',
    imports: [IconComponent, PopoverComponent, PopoverTriggerDirective, TableFilterComponent],
    host: {
        role: 'columnheader',
        scope: 'col',
        '[class]': 'classes()',
        '[attr.aria-sort]': 'ariaSort()'
    }
})
export class TableHeaderCellComponent<T> {
    private readonly config: TableConfig = inject(TABLE_CONFIG);

    /**
     * The column.
     */
    readonly column: InputSignal<TableColumn<T>> = input.required<TableColumn<T>>();

    /**
     * The order of the table.
     */
    readonly order: InputSignal<TableOrder | undefined> = input.required<TableOrder | undefined>();

    /**
     * What the column is filtered by, undefined for nothing.
     */
    readonly filter: InputSignal<unknown> = input.required<unknown>();

    /**
     * Emits when the user orders the table by the column.
     */
    readonly sorted: OutputEmitterRef<void> = output();

    /**
     * Emits the value the user filters the column by, undefined for nothing.
     */
    readonly filtered: OutputEmitterRef<unknown> = output<unknown>();

    /**
     * The name of the button that opens the filter, with the label of the column.
     */
    protected readonly filterLabel: Signal<string> = computed(() => this.config.filterLabel(this.column().label));

    /**
     * Whether the column has a filter, which a button in the header opens.
     */
    protected readonly hasFilter: Signal<boolean> = computed(() => this.column().filter != undefined);

    /**
     * Whether the column is filtered, which a dot on the button of the filter shows.
     */
    protected readonly isFiltered: Signal<boolean> = computed(() => this.filter() != undefined);

    /**
     * The icon of the button that opens the filter.
     */
    protected readonly filterIcon: IconDefinition = faMagnifyingGlass;

    /**
     * The tailwind classes of the button that opens the filter.
     */
    protected readonly filterButtonClasses: string = FILTER_BUTTON_CLASSES;

    /**
     * The tailwind classes of the dot that shows the column is filtered.
     */
    protected readonly filterDotClasses: string = FILTER_DOT_CLASSES;

    /**
     * The direction the table is ordered in by the column, if it is.
     */
    protected readonly direction: Signal<TableOrder['direction'] | undefined> = computed(() => {
        const order: TableOrder | undefined = this.order();
        return order?.key === this.column().key ? order.direction : undefined;
    });

    /**
     * What screen readers say about the order of a sortable column.
     */
    protected readonly ariaSort: Signal<'ascending' | 'descending' | 'none' | undefined> = computed(() => {
        if (this.column().sortable !== true) {
            return undefined;
        }
        const direction: TableOrder['direction'] | undefined = this.direction();
        if (direction == undefined) {
            return 'none';
        }
        return direction === 'ASC' ? 'ascending' : 'descending';
    });

    /**
     * The icon that shows the order.
     */
    protected readonly sortIcon: Signal<IconDefinition> = computed(() => {
        const direction: TableOrder['direction'] | undefined = this.direction();
        if (direction == undefined) {
            return faSort;
        }
        return direction === 'ASC' ? faSortUp : faSortDown;
    });

    /**
     * The tailwind classes of the header.
     */
    protected readonly classes: Signal<string> = computed(() => {
        const column: TableColumn<T> = this.column();
        return HEADER_CELL_CLASSES[column.sortable === true || this.hasFilter() ? 'interactive' : 'fixed'][column.align ?? 'start'];
    });

    /**
     * The tailwind classes of the button that orders by the column.
     */
    protected readonly buttonClasses: string = SORT_BUTTON_CLASSES;
}
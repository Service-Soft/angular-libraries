import { Component, computed, ElementRef, inject, input, InputSignal, model, ModelSignal, output, OutputEmitterRef, Signal, viewChildren } from '@angular/core';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { InputOption } from '@service-soft/ui/input';
import { InputSelectComponent } from '@service-soft/ui/input-select';
import { PaginationComponent } from '@service-soft/ui/pagination';

import { TableActiveFilter } from './table-active-filter.model';
import { TableConfig } from './table-config.model';
import { TABLE_CONFIG } from './table-config.provider';

const FILTER_BADGE_CLASSES: string = `
    inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-transparent bg-primary-tint ps-3 pe-2.5 text-label
    text-primary
    hover:bg-primary-tint-pressed
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
`;

/**
 * The footer below the rows of ui-table: the pagination, which rows the page shows, the select of the page size and the
 * badges of the filters that are set, which remove them. Internal to the table.
 */
@Component({
    selector: 'ui-table-footer',
    templateUrl: './table-footer.component.html',
    imports: [PaginationComponent, InputSelectComponent, IconComponent],
    host: { class: 'flex flex-wrap items-center gap-x-4 gap-y-2 bg-table-footer px-3 py-2' }
})
export class TableFooterComponent {
    private readonly config: TableConfig = inject(TABLE_CONFIG);

    /**
     * The id of the table, which the id of the select of the page size starts with.
     */
    readonly tableId: InputSignal<string> = input.required<string>();

    /**
     * The label of the table, which names its pagination.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * How many rows there are on all pages together.
     */
    readonly totalAmount: InputSignal<number> = input.required<number>();

    /**
     * The page sizes the user can choose from.
     */
    readonly pageSizes: InputSignal<number[]> = input.required<number[]>();

    /**
     * The filters that are set, which get a badge each.
     */
    readonly activeFilters: InputSignal<TableActiveFilter[]> = input.required<TableActiveFilter[]>();

    /**
     * The current page of the table.
     */
    readonly page: ModelSignal<number> = model.required<number>();

    /**
     * How many rows a page of the table has.
     */
    readonly pageSize: ModelSignal<number> = model.required<number>();

    /**
     * Emits the index of the badge of the filter the user removes.
     */
    readonly removedFilter: OutputEmitterRef<number> = output<number>();

    /**
     * The texts of the table.
     */
    protected readonly labels: TableConfig = this.config;

    /**
     * The tailwind classes of the badges of the filters.
     */
    // the text is primary on its tint, which the theme checks. A transparent border keeps the shape of the badge in
    // forced colors mode, where backgrounds are gone.
    protected readonly filterBadgeClasses: string = FILTER_BADGE_CLASSES;

    /**
     * The icon on the badges of the filters, which says that a click removes them.
     */
    protected readonly removeFilterIcon: IconDefinition = faXmark;

    /**
     * The buttons of the badges of the filters, which get the focus of a removed one.
     */
    private readonly filterBadges: Signal<readonly ElementRef<HTMLButtonElement>[]> = viewChildren<ElementRef<HTMLButtonElement>>(
        'filterBadge'
    );

    /**
     * What screen readers call the pagination, with the label of the table.
     */
    protected readonly paginationLabel: Signal<string> = computed(() => this.config.paginationLabel(this.label()));

    /**
     * Which rows the page shows, undefined while there are none.
     */
    protected readonly range: Signal<string | undefined> = computed(() => {
        const total: number = this.totalAmount();
        if (total === 0) {
            return undefined;
        }
        const first: number = ((this.page() - 1) * this.pageSize()) + 1;
        return this.config.rangeLabel(first, Math.min(first + this.pageSize() - 1, total), total);
    });

    /**
     * The range with the most digits there can be for this many rows, which the range is as wide as.
     */
    protected readonly widestRange: Signal<string> = computed(() => {
        const total: number = this.totalAmount();
        return this.config.rangeLabel(total, total, total);
    });

    /**
     * The page sizes to choose from, with the current one, in ascending order.
     */
    protected readonly pageSizeOptions: Signal<InputOption<number>[]> = computed(() => {
        return [...new Set([...this.pageSizes(), this.pageSize()])]
            .sort((a, b) => a - b)
            .map(size => ({ value: size, label: String(size) }));
    });

    /**
     * Whether the select of the page size shows, which changes nothing while every row fits on the smallest page.
     */
    protected readonly hasPageSizes: Signal<boolean> = computed(() => {
        return this.totalAmount() > (this.pageSizeOptions()[0]?.value ?? this.pageSize());
    });

    /**
     * The id of the select of the page size, which its visible label points to.
     */
    protected readonly pageSizeId: Signal<string> = computed(() => `${this.tableId()}-page-size`);

    /**
     * Focuses the badge of a filter, or the last one when there are fewer.
     * @param index - The index of the badge.
     * @returns Whether there was a badge to focus.
     */
    focusFilterBadge(index: number): boolean {
        const badges: readonly ElementRef<HTMLButtonElement>[] = this.filterBadges();
        const badge: HTMLButtonElement | undefined = badges[Math.min(index, badges.length - 1)]?.nativeElement;
        badge?.focus();
        return badge != undefined;
    }

    /**
     * Changes how many rows a page has, and goes to the page with the first row of the current one, so it stays in view.
     * @param pageSize - The new page size, undefined never comes from the required select.
     */
    protected changePageSize(pageSize: number | undefined): void {
        if (pageSize == undefined) {
            return;
        }
        const firstIndex: number = (this.page() - 1) * this.pageSize();
        this.pageSize.set(pageSize);
        this.page.set(Math.floor(firstIndex / pageSize) + 1);
    }
}
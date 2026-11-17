import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, InputSignal, model, ModelSignal, Signal } from '@angular/core';
import { faAnglesLeft, faAnglesRight, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent } from '@service-soft/ui/icon';

import { PaginationColor } from './pagination-color.type';
import { PaginationConfig } from './pagination-config.model';
import { PAGINATION_CONFIG } from './pagination-config.provider';
import { PaginationItem } from './pagination-item.model';

// how many buttons of pages show at most. Always as many while there are enough pages, so the pagination keeps its
// width from page to page.
const PAGE_BUTTON_COUNT: number = 5;

/**
 * Lets the user go through pages, like the ones of a list a backend answers in pages: a navigation with buttons for up
 * to five pages around the current one, between buttons for the page before and after and for the first and the last
 * page. Bind the current page with [(page)]. It shows nothing while there is only one page.
 */
@Component({
    selector: 'ui-pagination',
    templateUrl: './pagination.component.html',
    imports: [ButtonComponent, IconComponent],
    host: { class: 'block' }
})
export class PaginationComponent {
    private readonly config: PaginationConfig = inject(PAGINATION_CONFIG);

    private readonly injector: Injector = inject(Injector);

    private readonly host: ElementRef<HTMLElement> = inject<ElementRef<HTMLElement>>(ElementRef);

    /**
     * The icon of the button that goes to the first page.
     */
    protected readonly faAnglesLeft: typeof faAnglesLeft = faAnglesLeft;

    /**
     * The icon of the button that goes to the page before.
     */
    protected readonly faChevronLeft: typeof faChevronLeft = faChevronLeft;

    /**
     * The icon of the button that goes to the page after.
     */
    protected readonly faChevronRight: typeof faChevronRight = faChevronRight;

    /**
     * The icon of the button that goes to the last page.
     */
    protected readonly faAnglesRight: typeof faAnglesRight = faAnglesRight;

    /**
     * The current page, from 1 on. The user changes it, bind it with [(page)].
     */
    readonly page: ModelSignal<number> = model(1);

    /**
     * How many items there are on all pages together, like the totalAmount of a page of zibri.
     */
    readonly totalAmount: InputSignal<number> = input.required<number>();

    /**
     * How many items a page has.
     */
    readonly pageSize: InputSignal<number> = input.required<number>();

    /**
     * What screen readers call the navigation. Give each one its own when a page has more than one.
     */
    readonly label: InputSignal<string> = input(this.config.label);

    /**
     * The color of the button of the current page, and of the text of the other buttons. The default comes from
     * providePaginationConfig.
     */
    readonly color: InputSignal<PaginationColor> = input(this.config.color);

    /**
     * The texts of the buttons.
     */
    protected readonly labels: PaginationConfig = this.config;

    /**
     * How many pages there are, at least one.
     */
    protected readonly pageCount: Signal<number> = computed(() => Math.max(1, Math.ceil(this.totalAmount() / this.pageSize())));

    /**
     * The buttons of the pages.
     */
    protected readonly items: Signal<PaginationItem[]> = computed(() => this.resolveItems(this.page(), this.pageCount()));

    /**
     * How many digits the number of the last page has, which every button of a page is as wide as.
     */
    protected readonly digitCount: Signal<number> = computed(() => String(this.pageCount()).length);

    /**
     * Whether the current page is the first, which has none before it.
     */
    protected readonly isFirst: Signal<boolean> = computed(() => this.page() <= 1);

    /**
     * Whether the current page is the last, which has none after it.
     */
    protected readonly isLast: Signal<boolean> = computed(() => this.page() >= this.pageCount());

    // the button that was clicked can't be used on the first and the last page, and focus would be lost with it. The
    // button of the page takes it instead, which is where the user is now.
    /**
     * Goes to a page from one of the arrows, which go to the first page, the page before or after, or the last page.
     * @param page - The page.
     */
    protected goFromArrow(page: number): void {
        this.page.set(page);
        if (page === 1 || page === this.pageCount()) {
            this.focusCurrentPage();
        }
    }

    // the buttons are tracked by their position, so when the pages move, the clicked one shows another page. The focus
    // follows the page that was clicked, to the button of the current page.
    /**
     * Goes to a page from its button.
     * @param page - The page.
     */
    protected goFromPage(page: number): void {
        this.page.set(page);
        this.focusCurrentPage();
    }

    private focusCurrentPage(): void {
        afterNextRender(() => {
            this.host.nativeElement.querySelector<HTMLButtonElement>('button[aria-current="page"]')?.focus();
        }, { injector: this.injector });
    }

    // the current page in the middle, moved to the side near the first and the last page, so there are always as many.
    // No gaps for the pages in between: they changed the number of buttons from page to page, and with it the width.
    private resolveItems(current: number, pageCount: number): PaginationItem[] {
        const first: number = Math.max(1, Math.min(current - Math.floor(PAGE_BUTTON_COUNT / 2), pageCount - PAGE_BUTTON_COUNT + 1));
        const count: number = Math.min(PAGE_BUTTON_COUNT, pageCount);
        return Array.from({ length: count }, (_, index) => this.toItem(first + index, current));
    }

    private toItem(page: number, current: number): PaginationItem {
        return {
            page,
            label: this.config.pageLabel(page),
            variant: page === current ? 'filled' : 'text',
            ariaCurrent: page === current ? 'page' : undefined
        };
    }
}
import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { ButtonColor, ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { SearchToolbarConfig } from './search-toolbar-config.model';
import { SEARCH_TOOLBAR_CONFIG } from './search-toolbar-config.provider';

// the badge takes the colors of the button the other way round: the on- color on a filled button, the color on an
// outlined or text one. Both are pairs whose contrast is checked. A transparent border keeps its shape in forced
// colors mode.
const BADGE_BASE_CLASSES: string = `
    inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border border-transparent px-1.5 text-label-sm
`;
const BADGE_CLASSES: Record<'filled' | 'unfilled', Record<ButtonColor, string>> = {
    filled: {
        primary: 'bg-on-primary text-primary',
        secondary: 'bg-on-secondary text-secondary',
        error: 'bg-on-error text-error',
        success: 'bg-on-success text-success'
    },
    unfilled: {
        primary: 'bg-primary text-on-primary',
        secondary: 'bg-secondary text-on-secondary',
        error: 'bg-error text-on-error',
        success: 'bg-success text-on-success'
    }
};

/**
 * A button that opens the filters of a list, with a funnel in front of its text and the number of active filters as a
 * badge after it: `<button ui-filter-button type="button" [count]="2">Filters</button>`. It is a ui-button, so it
 * takes the same inputs and works with whatever opens the filters, like a popover trigger or a click handler.
 * Screen readers read the number of active filters after its name, like 'Filters (2 active)'.
 * Unset inputs fall back to the values provided with provideButtonConfig, the text of the count to the one of
 * provideSearchToolbarConfig.
 */
@Component({
    selector: 'button[ui-filter-button]',
    templateUrl: './filter-button.component.html',
    imports: [IconComponent]
})
export class FilterButtonComponent extends ButtonComponent {
    private readonly toolbarConfig: SearchToolbarConfig = inject(SEARCH_TOOLBAR_CONFIG);

    /**
     * How many filters are active. Without any, there is no badge.
     */
    readonly count: InputSignal<number> = input<number>(0);

    /**
     * The funnel in front of the text.
     */
    protected readonly filterIcon: IconDefinition = faFilter;

    /**
     * What screen readers read about the active filters.
     */
    protected readonly countLabel: Signal<string> = computed(() => this.toolbarConfig.activeFiltersLabel(this.count()));

    /**
     * The tailwind classes of the badge.
     */
    // a pressed button is filled, like a filled one.
    protected readonly badgeClasses: Signal<string> = computed(() => {
        const filled: boolean = this.variant() === 'filled' || this.pressed() === true;
        return `${BADGE_BASE_CLASSES} ${BADGE_CLASSES[filled ? 'filled' : 'unfilled'][this.color()]}`;
    });
}
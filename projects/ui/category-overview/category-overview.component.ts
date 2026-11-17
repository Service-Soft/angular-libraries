import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { HeadingComponent, HeadingLevel } from '@service-soft/ui/heading';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { CategoryOverviewConfig } from './category-overview-config.model';
import { CATEGORY_OVERVIEW_CONFIG } from './category-overview-config.provider';
import { CategoryOverviewGroup } from './category-overview-group.model';
import { CategoryOverviewHeadingLevel } from './category-overview-heading-level.type';

// the titles of the items are one level below the heading of their category.
const ITEM_LEVELS: Record<CategoryOverviewHeadingLevel, HeadingLevel> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };

/**
 * Items grouped under the headings of their categories, each on a small card with a check in front of its title and
 * text, like the treatments of a dental practice:
 * `<ui-category-overview [groups]="[{ name: 'Prophylaxis', items: [{ title: 'Teeth cleaning', text: '…' }] }]" />`.
 * The cards of a category stand next to each other where there is room. Filter the groups with `<ui-filter-tiles>`.
 * Unset inputs fall back to the values provided with provideCategoryOverviewConfig.
 */
@Component({
    selector: 'ui-category-overview',
    templateUrl: './category-overview.component.html',
    imports: [HeadingComponent, IconComponent],
    host: {
        // a container, so the number of cards next to each other follows its own width, which works in a narrow column
        // of a wide screen as well.
        class: 'flex flex-col gap-10 @container'
    }
})
export class CategoryOverviewComponent {
    private readonly config: CategoryOverviewConfig = inject(CATEGORY_OVERVIEW_CONFIG);

    /**
     * The categories with their items, in the order they show.
     */
    readonly groups: InputSignal<CategoryOverviewGroup[]> = input.required<CategoryOverviewGroup[]>();

    /**
     * The level of the headings of the categories, which fits the headings of the page; the titles of the items are
     * one level below. The default comes from provideCategoryOverviewConfig.
     */
    readonly headingLevel: InputSignal<CategoryOverviewHeadingLevel> = input<CategoryOverviewHeadingLevel>(this.config.headingLevel);

    /**
     * The icon in front of every item. The default comes from provideCategoryOverviewConfig.
     */
    readonly icon: InputSignal<IconDefinition> = input<IconDefinition>(this.config.icon);

    /**
     * The level of the titles of the items.
     */
    protected readonly itemLevel: Signal<HeadingLevel> = computed(() => ITEM_LEVELS[this.headingLevel()]);
}
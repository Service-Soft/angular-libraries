import { IconDefinition } from '@service-soft/ui/icon';

import { CategoryOverviewHeadingLevel } from './category-overview-heading-level.type';

/**
 * The values a category overview uses when its inputs are not set.
 */
export type CategoryOverviewConfig = {
    /**
     * The level of the headings of the categories.
     */
    headingLevel: CategoryOverviewHeadingLevel,
    /**
     * The icon in front of every item.
     */
    icon: IconDefinition
};
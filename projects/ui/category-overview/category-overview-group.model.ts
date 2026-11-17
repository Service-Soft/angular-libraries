import { CategoryOverviewItem } from './category-overview-item.model';

/**
 * A category of a category overview and its items, under its heading.
 */
export type CategoryOverviewGroup = {
    /**
     * The name of the category, which is the heading of its items.
     */
    name: string,
    /**
     * The id of the section of the category, so a link can lead to it, like '#implants'.
     */
    id?: string,
    /**
     * The items of the category.
     */
    items: CategoryOverviewItem[]
};
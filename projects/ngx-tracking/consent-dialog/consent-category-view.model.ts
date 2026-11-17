import { GdprCategory } from '@service-soft/ngx-tracking/consent';

import { ConsentOptionView } from './consent-option-view.model';

/**
 * A category of trackings as the consent dialog shows it.
 */
export type ConsentCategoryView = {
    /**
     * The category.
     */
    category: GdprCategory,
    /**
     * What the category is called.
     */
    title: string,
    /**
     * Whether the user can't change it, because it is technically necessary.
     */
    required: boolean,
    /**
     * Whether every tracking of the category is checked.
     */
    allChecked: boolean,
    /**
     * Whether some but not all trackings of the category are checked.
     */
    someChecked: boolean,
    /**
     * The trackings of the category.
     */
    options: ConsentOptionView[]
};
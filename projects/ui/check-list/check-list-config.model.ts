import { IconDefinition } from '@service-soft/ui/icon';

import { CheckListColor } from './check-list-color.type';

/**
 * The values a check list uses when its inputs are not set.
 */
export type CheckListConfig = {
    /**
     * The color of the icons of the included items.
     */
    color: CheckListColor,
    /**
     * The icon of an included item.
     */
    icon: IconDefinition,
    /**
     * The icon of an item that is not included, which sets it apart by its shape as well as by its color.
     */
    excludedIcon: IconDefinition,
    /**
     * What screen readers read after an item that is not included, as they get neither the icon nor the color.
     */
    excludedLabel: string
};
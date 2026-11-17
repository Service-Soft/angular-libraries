import { IconDefinition } from '@service-soft/ui/icon';

import { FilterTileOption } from './filter-tile-option.model';

/**
 * A tile of a filter as it shows, the one that shows everything as well.
 */
export type FilterTile<T> = {
    /**
     * The option it stands for, undefined for the one that shows everything.
     */
    option: FilterTileOption<T> | undefined,
    /**
     * What it is called.
     */
    label: string,
    /**
     * The icon above the label.
     */
    icon: IconDefinition | undefined,
    /**
     * How many items it has.
     */
    count: number | undefined,
    /**
     * What screen readers read for the count, like '12 items'.
     */
    countLabel: string,
    /**
     * Whether it is chosen.
     */
    pressed: boolean,
    /**
     * The tailwind classes of the tile.
     */
    classes: string
};
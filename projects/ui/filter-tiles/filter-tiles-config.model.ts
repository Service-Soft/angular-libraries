import { IconDefinition } from '@service-soft/ui/icon';

import { FilterTilesColor } from './filter-tiles-color.type';

/**
 * The values filter tiles use when their inputs are not set.
 */
export type FilterTilesConfig = {
    /**
     * The color of the tiles.
     */
    color: FilterTilesColor,
    /**
     * The label of the tile that shows everything.
     */
    allLabel: string,
    /**
     * The icon of the tile that shows everything, while the other tiles have icons.
     */
    allIcon: IconDefinition,
    /**
     * What screen readers read for the count of a tile, like '12 items'.
     */
    countLabel: (count: number) => string
};
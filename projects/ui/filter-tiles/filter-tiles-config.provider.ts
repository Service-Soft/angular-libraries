import { inject, InjectionToken, Provider } from '@angular/core';
import { faBorderAll } from '@fortawesome/free-solid-svg-icons';

import { FilterTilesConfig } from './filter-tiles-config.model';

const DEFAULT_FILTER_TILES_CONFIG: FilterTilesConfig = {
    color: 'primary',
    allLabel: 'All',
    allIcon: faBorderAll,
    countLabel: count => count === 1 ? '1 item' : `${count} items`
};

/**
 * The values every filter tiles below this injector use when their inputs are not set.
 * Change them with provideFilterTilesConfig.
 */
export const FILTER_TILES_CONFIG: InjectionToken<FilterTilesConfig> = new InjectionToken<FilterTilesConfig>('FILTER_TILES_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_FILTER_TILES_CONFIG
});

/**
 * Changes the values filter tiles use when their inputs are not set, like their texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for FILTER_TILES_CONFIG.
 */
export function provideFilterTilesConfig(config: Partial<FilterTilesConfig>): Provider {
    return {
        provide: FILTER_TILES_CONFIG,
        useFactory: (): FilterTilesConfig => ({
            ...inject(FILTER_TILES_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_FILTER_TILES_CONFIG,
            ...config
        })
    };
}
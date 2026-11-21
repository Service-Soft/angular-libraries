import { inject, InjectionToken, Provider } from '@angular/core';
import { faBorderAll } from '@fortawesome/free-solid-svg-icons';

import { FilterTilesConfig } from './filter-tiles-config.model';

/**
 * The values of filter tiles when nothing changes them. Their texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultFilterTilesConfig(): FilterTilesConfig {
    return {
        color: 'primary',
        allLabel: $localize`:@@ui.filter-tiles.allLabel:All`,
        allIcon: faBorderAll,
        // a text of its own for each form, as $localize has no plurals.
        countLabel: count => count === 1
            ? $localize`:@@ui.filter-tiles.countLabel.one:1 item`
            : $localize`:@@ui.filter-tiles.countLabel.other:${count}:count: items`
    };
}

/**
 * The values every filter tiles below this injector use when their inputs are not set.
 * Change them with provideFilterTilesConfig.
 */
export const FILTER_TILES_CONFIG: InjectionToken<FilterTilesConfig> = new InjectionToken<FilterTilesConfig>('FILTER_TILES_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultFilterTilesConfig()
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
            ...inject(FILTER_TILES_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultFilterTilesConfig(),
            ...config
        })
    };
}
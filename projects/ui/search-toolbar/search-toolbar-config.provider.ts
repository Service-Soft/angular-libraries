import { inject, InjectionToken, Provider } from '@angular/core';

import { SearchToolbarConfig } from './search-toolbar-config.model';

const DEFAULT_SEARCH_TOOLBAR_CONFIG: SearchToolbarConfig = {
    searchLabel: 'Search',
    resultCountLabel: count => count === 1 ? '1 result' : `${count} results`,
    activeFiltersLabel: count => `${count} active`
};

/**
 * The values every search toolbar and filter button below this injector uses when their inputs are not set.
 * Change them with provideSearchToolbarConfig.
 */
export const SEARCH_TOOLBAR_CONFIG: InjectionToken<SearchToolbarConfig> = new InjectionToken<SearchToolbarConfig>('SEARCH_TOOLBAR_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_SEARCH_TOOLBAR_CONFIG
});

/**
 * Changes the values search toolbars and filter buttons use when their inputs are not set, like their texts to
 * translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for SEARCH_TOOLBAR_CONFIG.
 */
export function provideSearchToolbarConfig(config: Partial<SearchToolbarConfig>): Provider {
    return {
        provide: SEARCH_TOOLBAR_CONFIG,
        useFactory: (): SearchToolbarConfig => ({
            ...inject(SEARCH_TOOLBAR_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_SEARCH_TOOLBAR_CONFIG,
            ...config
        })
    };
}
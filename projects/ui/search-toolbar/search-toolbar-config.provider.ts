import { inject, InjectionToken, Provider } from '@angular/core';

import { SearchToolbarConfig } from './search-toolbar-config.model';

/**
 * The values of a search toolbar and a filter button when nothing changes them. Their texts are $localize, which an app
 * translates like its own, and resolved once the config is injected, so translations an app loads at runtime apply as
 * well.
 * @returns The default config.
 */
function getDefaultSearchToolbarConfig(): SearchToolbarConfig {
    return {
        searchLabel: $localize`:@@ui.search-toolbar.searchLabel:Search`,
        // a text of its own for each form, as $localize has no plurals.
        resultCountLabel: count => count === 1
            ? $localize`:@@ui.search-toolbar.resultCountLabel.one:1 result`
            : $localize`:@@ui.search-toolbar.resultCountLabel.other:${count}:count: results`,
        activeFiltersLabel: count => $localize`:@@ui.search-toolbar.activeFiltersLabel:${count}:count: active`
    };
}

/**
 * The values every search toolbar and filter button below this injector uses when their inputs are not set.
 * Change them with provideSearchToolbarConfig.
 */
export const SEARCH_TOOLBAR_CONFIG: InjectionToken<SearchToolbarConfig> = new InjectionToken<SearchToolbarConfig>('SEARCH_TOOLBAR_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultSearchToolbarConfig()
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
            ...inject(SEARCH_TOOLBAR_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultSearchToolbarConfig(),
            ...config
        })
    };
}
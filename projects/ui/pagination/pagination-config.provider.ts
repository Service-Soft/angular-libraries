import { inject, InjectionToken, Provider } from '@angular/core';

import { PaginationConfig } from './pagination-config.model';

/**
 * The values of a pagination when nothing changes them. Its texts are $localize, which an app translates like its own,
 * and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultPaginationConfig(): PaginationConfig {
    return {
        color: 'primary',
        label: $localize`:@@ui.pagination.label:Pages`,
        firstLabel: $localize`:@@ui.pagination.firstLabel:First page`,
        previousLabel: $localize`:@@ui.pagination.previousLabel:Previous page`,
        nextLabel: $localize`:@@ui.pagination.nextLabel:Next page`,
        lastLabel: $localize`:@@ui.pagination.lastLabel:Last page`,
        pageLabel: page => $localize`:@@ui.pagination.pageLabel:Page ${page}:page:`
    };
}

/**
 * The values every pagination below this injector uses when its inputs are not set, and its texts.
 * Change them with providePaginationConfig.
 */
export const PAGINATION_CONFIG: InjectionToken<PaginationConfig> = new InjectionToken<PaginationConfig>('PAGINATION_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultPaginationConfig()
});

/**
 * Changes the values every pagination uses when its inputs are not set, like the texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for PAGINATION_CONFIG.
 */
export function providePaginationConfig(config: Partial<PaginationConfig>): Provider {
    return {
        provide: PAGINATION_CONFIG,
        useFactory: (): PaginationConfig => ({
            ...inject(PAGINATION_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultPaginationConfig(),
            ...config
        })
    };
}
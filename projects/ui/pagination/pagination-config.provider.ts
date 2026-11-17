import { inject, InjectionToken, Provider } from '@angular/core';

import { PaginationConfig } from './pagination-config.model';

const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
    color: 'primary',
    label: 'Pages',
    firstLabel: 'First page',
    previousLabel: 'Previous page',
    nextLabel: 'Next page',
    lastLabel: 'Last page',
    pageLabel: page => `Page ${page}`
};

/**
 * The values every pagination below this injector uses when its inputs are not set, and its texts.
 * Change them with providePaginationConfig.
 */
export const PAGINATION_CONFIG: InjectionToken<PaginationConfig> = new InjectionToken<PaginationConfig>('PAGINATION_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_PAGINATION_CONFIG
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
            ...inject(PAGINATION_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_PAGINATION_CONFIG,
            ...config
        })
    };
}
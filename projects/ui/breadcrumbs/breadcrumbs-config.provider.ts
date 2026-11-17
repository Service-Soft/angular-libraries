import { inject, InjectionToken, Provider } from '@angular/core';

import { BreadcrumbsConfig } from './breadcrumbs-config.model';

const DEFAULT_BREADCRUMBS_CONFIG: BreadcrumbsConfig = {
    label: 'Breadcrumbs'
};

/**
 * The values all breadcrumbs below this injector use when their inputs are not set.
 * Change them with provideBreadcrumbsConfig.
 */
export const BREADCRUMBS_CONFIG: InjectionToken<BreadcrumbsConfig> = new InjectionToken<BreadcrumbsConfig>('BREADCRUMBS_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_BREADCRUMBS_CONFIG
});

/**
 * Changes the values breadcrumbs use when their inputs are not set, like the label to translate it.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for BREADCRUMBS_CONFIG.
 */
export function provideBreadcrumbsConfig(config: Partial<BreadcrumbsConfig>): Provider {
    return {
        provide: BREADCRUMBS_CONFIG,
        useFactory: (): BreadcrumbsConfig => ({
            ...inject(BREADCRUMBS_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_BREADCRUMBS_CONFIG,
            ...config
        })
    };
}
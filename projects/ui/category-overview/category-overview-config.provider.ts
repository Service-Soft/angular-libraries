import { inject, InjectionToken, Provider } from '@angular/core';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

import { CategoryOverviewConfig } from './category-overview-config.model';

const DEFAULT_CATEGORY_OVERVIEW_CONFIG: CategoryOverviewConfig = {
    headingLevel: 2,
    icon: faCircleCheck
};

/**
 * The values every category overview below this injector uses when its inputs are not set.
 * Change them with provideCategoryOverviewConfig.
 */
export const CATEGORY_OVERVIEW_CONFIG: InjectionToken<CategoryOverviewConfig> = new InjectionToken<CategoryOverviewConfig>(
    'CATEGORY_OVERVIEW_CONFIG',
    {
        providedIn: 'root',
        factory: () => DEFAULT_CATEGORY_OVERVIEW_CONFIG
    }
);

/**
 * Changes the values category overviews use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for CATEGORY_OVERVIEW_CONFIG.
 */
export function provideCategoryOverviewConfig(config: Partial<CategoryOverviewConfig>): Provider {
    return {
        provide: CATEGORY_OVERVIEW_CONFIG,
        useFactory: (): CategoryOverviewConfig => ({
            ...inject(CATEGORY_OVERVIEW_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_CATEGORY_OVERVIEW_CONFIG,
            ...config
        })
    };
}
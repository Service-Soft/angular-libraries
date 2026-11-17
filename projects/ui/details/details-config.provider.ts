import { inject, InjectionToken, Provider } from '@angular/core';

import { DetailsConfig } from './details-config.model';

const DEFAULT_DETAILS_CONFIG: DetailsConfig = {
    variant: 'outlined',
    color: 'neutral'
};

/**
 * The values every details section below this injector uses when its inputs are not set.
 * Change them with provideDetailsConfig.
 */
export const DETAILS_CONFIG: InjectionToken<DetailsConfig> = new InjectionToken<DetailsConfig>('DETAILS_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_DETAILS_CONFIG
});

/**
 * Changes the values details sections use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for DETAILS_CONFIG.
 */
export function provideDetailsConfig(config: Partial<DetailsConfig>): Provider {
    return {
        provide: DETAILS_CONFIG,
        useFactory: (): DetailsConfig => ({
            ...inject(DETAILS_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_DETAILS_CONFIG,
            ...config
        })
    };
}
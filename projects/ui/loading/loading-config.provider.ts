import { inject, InjectionToken, Provider } from '@angular/core';

import { LoadingConfig } from './loading-config.model';

const DEFAULT_LOADING_CONFIG: LoadingConfig = {
    label: 'Loading',
    size: 'lg'
};

/**
 * The values every area that loads below this injector uses when its inputs are not set, and its text.
 * Change them with provideLoadingConfig.
 */
export const LOADING_CONFIG: InjectionToken<LoadingConfig> = new InjectionToken<LoadingConfig>('LOADING_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_LOADING_CONFIG
});

/**
 * Changes the values areas that load use when their inputs are not set, and their text, like to translate it.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for LOADING_CONFIG.
 */
export function provideLoadingConfig(config: Partial<LoadingConfig>): Provider {
    return {
        provide: LOADING_CONFIG,
        useFactory: (): LoadingConfig => ({
            ...inject(LOADING_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_LOADING_CONFIG,
            ...config
        })
    };
}
import { inject, InjectionToken, Provider } from '@angular/core';

import { LoadingConfig } from './loading-config.model';

/**
 * The values of an area that loads when nothing changes them. Its label is $localize, which an app translates like its
 * own texts, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultLoadingConfig(): LoadingConfig {
    return {
        label: $localize`:@@ui.loading.label:Loading`,
        size: 'lg'
    };
}

/**
 * The values every area that loads below this injector uses when its inputs are not set, and its text.
 * Change them with provideLoadingConfig.
 */
export const LOADING_CONFIG: InjectionToken<LoadingConfig> = new InjectionToken<LoadingConfig>('LOADING_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultLoadingConfig()
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
            ...inject(LOADING_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultLoadingConfig(),
            ...config
        })
    };
}
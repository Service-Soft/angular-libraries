import { inject, InjectionToken, Provider } from '@angular/core';

import { LogoCloudConfig } from './logo-cloud-config.model';

// logos link to other sites, like the ones of sponsors, which keep the page open behind them. They keep their colors,
// which is what a sponsor expects to see.
const DEFAULT_LOGO_CLOUD_CONFIG: LogoCloudConfig = {
    openInNewTab: true,
    grayscale: false
};

/**
 * The values every logo cloud below this injector uses for the logos that don't set their own.
 * Change them with provideLogoCloudConfig.
 */
export const LOGO_CLOUD_CONFIG: InjectionToken<LogoCloudConfig> = new InjectionToken<LogoCloudConfig>('LOGO_CLOUD_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_LOGO_CLOUD_CONFIG
});

/**
 * Changes the values logo clouds use for the logos that don't set their own.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for LOGO_CLOUD_CONFIG.
 */
export function provideLogoCloudConfig(config: Partial<LogoCloudConfig>): Provider {
    return {
        provide: LOGO_CLOUD_CONFIG,
        useFactory: (): LogoCloudConfig => ({
            ...inject(LOGO_CLOUD_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_LOGO_CLOUD_CONFIG,
            ...config
        })
    };
}
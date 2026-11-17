import { inject, InjectionToken, Provider } from '@angular/core';

import { IframeConfig } from './iframe-config.model';

const DEFAULT_IFRAME_CONFIG: IframeConfig = {
    aspectRatio: '16 / 9'
};

/**
 * The values every iframe below this injector uses when its inputs are not set.
 * Change them with provideIframeConfig.
 */
export const IFRAME_CONFIG: InjectionToken<IframeConfig> = new InjectionToken<IframeConfig>('IFRAME_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_IFRAME_CONFIG
});

/**
 * Changes the values iframes use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for IFRAME_CONFIG.
 */
export function provideIframeConfig(config: Partial<IframeConfig>): Provider {
    return {
        provide: IFRAME_CONFIG,
        useFactory: (): IframeConfig => ({
            ...inject(IFRAME_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_IFRAME_CONFIG,
            ...config
        })
    };
}
import { inject, InjectionToken, Provider } from '@angular/core';

import { LinkConfig } from './link-config.model';

const DEFAULT_LINK_CONFIG: LinkConfig = {
    appearance: 'inline',
    newTabLabel: 'opens in a new tab'
};

/**
 * The values every link below this injector uses when its inputs are not set.
 * Change them with provideLinkConfig.
 */
export const LINK_CONFIG: InjectionToken<LinkConfig> = new InjectionToken<LinkConfig>('LINK_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_LINK_CONFIG
});

/**
 * Changes the values links use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for LINK_CONFIG.
 */
export function provideLinkConfig(config: Partial<LinkConfig>): Provider {
    return {
        provide: LINK_CONFIG,
        useFactory: (): LinkConfig => ({
            ...inject(LINK_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_LINK_CONFIG,
            ...config
        })
    };
}
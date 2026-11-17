import { inject, InjectionToken, Provider } from '@angular/core';

import { TabsConfig } from './tabs-config.model';

const DEFAULT_TABS_CONFIG: TabsConfig = {
    variant: 'underlined',
    color: 'primary'
};

/**
 * The values all tabs below this injector use when their inputs are not set.
 * Change them with provideTabsConfig.
 */
export const TABS_CONFIG: InjectionToken<TabsConfig> = new InjectionToken<TabsConfig>('TABS_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_TABS_CONFIG
});

/**
 * Changes the values tabs use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for TABS_CONFIG.
 */
export function provideTabsConfig(config: Partial<TabsConfig>): Provider {
    return {
        provide: TABS_CONFIG,
        useFactory: (): TabsConfig => ({
            ...inject(TABS_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_TABS_CONFIG,
            ...config
        })
    };
}
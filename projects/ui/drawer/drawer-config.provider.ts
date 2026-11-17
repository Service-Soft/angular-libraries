import { inject, InjectionToken, Provider } from '@angular/core';

import { DrawerConfig } from './drawer-config.model';

const DEFAULT_DRAWER_CONFIG: DrawerConfig = {
    side: 'start',
    color: 'surface',
    header: false,
    closeLabel: 'Close'
};

/**
 * The values every drawer below this injector uses when its inputs are not set.
 * Change them with provideDrawerConfig.
 */
export const DRAWER_CONFIG: InjectionToken<DrawerConfig> = new InjectionToken<DrawerConfig>('DRAWER_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_DRAWER_CONFIG
});

/**
 * Changes the values drawers use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for DRAWER_CONFIG.
 */
export function provideDrawerConfig(config: Partial<DrawerConfig>): Provider {
    return {
        provide: DRAWER_CONFIG,
        useFactory: (): DrawerConfig => ({
            ...inject(DRAWER_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_DRAWER_CONFIG,
            ...config
        })
    };
}
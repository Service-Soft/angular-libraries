import { inject, InjectionToken, Provider } from '@angular/core';

import { StatConfig } from './stat-config.model';

const DEFAULT_STAT_CONFIG: StatConfig = {
    color: 'primary',
    format: {},
    duration: 1500
};

/**
 * The values every stat below this injector uses when its inputs are not set.
 * Change them with provideStatConfig.
 */
export const STAT_CONFIG: InjectionToken<StatConfig> = new InjectionToken<StatConfig>('STAT_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_STAT_CONFIG
});

/**
 * Changes the values stats use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for STAT_CONFIG.
 */
export function provideStatConfig(config: Partial<StatConfig>): Provider {
    return {
        provide: STAT_CONFIG,
        useFactory: (): StatConfig => ({
            ...inject(STAT_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_STAT_CONFIG,
            ...config
        })
    };
}
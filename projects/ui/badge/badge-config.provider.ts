import { inject, InjectionToken, Provider } from '@angular/core';

import { BadgeConfig } from './badge-config.model';

const DEFAULT_BADGE_CONFIG: BadgeConfig = {
    color: 'primary',
    variant: 'tinted',
    size: 'sm'
};

/**
 * The values every badge below this injector uses when its inputs are not set.
 * Change them with provideBadgeConfig.
 */
export const BADGE_CONFIG: InjectionToken<BadgeConfig> = new InjectionToken<BadgeConfig>('BADGE_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_BADGE_CONFIG
});

/**
 * Changes the values badges use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for BADGE_CONFIG.
 */
export function provideBadgeConfig(config: Partial<BadgeConfig>): Provider {
    return {
        provide: BADGE_CONFIG,
        useFactory: (): BadgeConfig => ({
            ...inject(BADGE_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_BADGE_CONFIG,
            ...config
        })
    };
}
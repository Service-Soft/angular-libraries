import { inject, InjectionToken, Provider } from '@angular/core';

import { AvatarConfig } from './avatar-config.model';

const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
    size: 'md',
    color: 'primary'
};

/**
 * The values every avatar below this injector uses when its inputs are not set.
 * Change them with provideAvatarConfig.
 */
export const AVATAR_CONFIG: InjectionToken<AvatarConfig> = new InjectionToken<AvatarConfig>('AVATAR_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_AVATAR_CONFIG
});

/**
 * Changes the values avatars use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for AVATAR_CONFIG.
 */
export function provideAvatarConfig(config: Partial<AvatarConfig>): Provider {
    return {
        provide: AVATAR_CONFIG,
        useFactory: (): AvatarConfig => ({
            ...inject(AVATAR_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_AVATAR_CONFIG,
            ...config
        })
    };
}
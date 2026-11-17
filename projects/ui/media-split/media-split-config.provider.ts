import { inject, InjectionToken, Provider } from '@angular/core';

import { MediaSplitConfig } from './media-split-config.model';

const DEFAULT_MEDIA_SPLIT_CONFIG: MediaSplitConfig = {
    position: 'start',
    mediaWidth: 'half',
    align: 'center'
};

/**
 * The values every media split below this injector uses when its inputs are not set.
 * Change them with provideMediaSplitConfig.
 */
export const MEDIA_SPLIT_CONFIG: InjectionToken<MediaSplitConfig> = new InjectionToken<MediaSplitConfig>('MEDIA_SPLIT_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_MEDIA_SPLIT_CONFIG
});

/**
 * Changes the values media splits use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for MEDIA_SPLIT_CONFIG.
 */
export function provideMediaSplitConfig(config: Partial<MediaSplitConfig>): Provider {
    return {
        provide: MEDIA_SPLIT_CONFIG,
        useFactory: (): MediaSplitConfig => ({
            ...inject(MEDIA_SPLIT_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_MEDIA_SPLIT_CONFIG,
            ...config
        })
    };
}
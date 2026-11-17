import { inject, InjectionToken, Provider } from '@angular/core';

import { GalleryConfig } from './gallery-config.model';

const DEFAULT_GALLERY_CONFIG: GalleryConfig = {
    label: 'Pictures',
    previousLabel: 'Previous picture',
    nextLabel: 'Next picture',
    closeLabel: 'Close',
    positionLabel: (position, count) => `Picture ${position} of ${count}`
};

/**
 * The texts every gallery below this injector uses.
 * Change them with provideGalleryConfig.
 */
export const GALLERY_CONFIG: InjectionToken<GalleryConfig> = new InjectionToken<GalleryConfig>('GALLERY_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_GALLERY_CONFIG
});

/**
 * Changes the texts galleries use, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for GALLERY_CONFIG.
 */
export function provideGalleryConfig(config: Partial<GalleryConfig>): Provider {
    return {
        provide: GALLERY_CONFIG,
        useFactory: (): GalleryConfig => ({
            ...inject(GALLERY_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_GALLERY_CONFIG,
            ...config
        })
    };
}
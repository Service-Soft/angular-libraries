import { inject, InjectionToken, Provider } from '@angular/core';

import { GalleryConfig } from './gallery-config.model';

/**
 * The texts of a gallery when nothing changes them. They are $localize, which an app translates like its own texts, and
 * resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultGalleryConfig(): GalleryConfig {
    return {
        label: $localize`:@@ui.gallery.label:Pictures`,
        previousLabel: $localize`:@@ui.gallery.previousLabel:Previous picture`,
        nextLabel: $localize`:@@ui.gallery.nextLabel:Next picture`,
        closeLabel: $localize`:@@ui.gallery.closeLabel:Close`,
        positionLabel: (position, count) => $localize`:@@ui.gallery.positionLabel:Picture ${position}:position: of ${count}:count:`
    };
}

/**
 * The texts every gallery below this injector uses.
 * Change them with provideGalleryConfig.
 */
export const GALLERY_CONFIG: InjectionToken<GalleryConfig> = new InjectionToken<GalleryConfig>('GALLERY_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultGalleryConfig()
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
            ...inject(GALLERY_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultGalleryConfig(),
            ...config
        })
    };
}
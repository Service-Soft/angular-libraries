import { InjectionToken, Provider } from '@angular/core';

import { MetaPixelConfig } from './meta-pixel-config.model';

/**
 * The pixel the MetaPixelService tracks for. Set it with provideMetaPixel.
 */
export const META_PIXEL_CONFIG: InjectionToken<MetaPixelConfig> = new InjectionToken<MetaPixelConfig>('META_PIXEL_CONFIG', {
    providedIn: 'root',
    factory: () => {
        throw new Error('The MetaPixelService needs a pixel id. Add provideMetaPixel({ pixelId }) to the providers of your app.');
    }
});

/**
 * Sets the pixel the MetaPixelService tracks for. Provide it in the application config.
 * @param config - The pixel id.
 * @returns The provider for META_PIXEL_CONFIG.
 */
export function provideMetaPixel(config: MetaPixelConfig): Provider {
    return { provide: META_PIXEL_CONFIG, useValue: config };
}
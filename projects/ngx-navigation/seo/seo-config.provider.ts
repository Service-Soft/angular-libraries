import { InjectionToken } from '@angular/core';

import { SeoConfig } from './seo-config.model';

/**
 * What every page tells search engines about itself, next to the data of its route. Set it with provideSeoConfig.
 */
export const SEO_CONFIG: InjectionToken<SeoConfig> = new InjectionToken<SeoConfig>('SEO_CONFIG', {
    providedIn: 'root',
    factory: () => {
        throw new Error('The SEO of the navigation needs the origin of the site. Add provideSeoConfig({ origin }) '
            + 'to the providers of your app.');
    }
});
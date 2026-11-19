import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';

import { SeoConfigChanges } from './seo-config-changes.model';
import { SeoConfig } from './seo-config.model';
import { SEO_CONFIG } from './seo-config.provider';
import { SeoService } from './seo.service';

/**
 * Writes what each page tells search engines and AI assistants about itself into the head of the document, on every
 * navigation and on the server too, so the prerendered html holds it: the description, the canonical url, the
 * structured data, the robots and the og tags of a shared link, from the NavRouteData of its routes. Provide it in
 * the application config: `provideSeoConfig({ origin: 'https://example.com' })`.
 * @param config - The origin of the site, and a default image if you like.
 * @returns The providers for the SEO.
 */
export function provideSeoConfig(config: SeoConfigChanges): EnvironmentProviders {
    // no merging with a parent injector: the tags are the ones of the document, which only the root injector writes.
    const seoConfig: SeoConfig = { origin: config.origin.replace(/\/+$/, ''), defaultImage: config.defaultImage };
    return makeEnvironmentProviders([
        { provide: SEO_CONFIG, useValue: seoConfig },
        // before the first navigation, whose tags the service writes as well
        provideAppInitializer(() => {
            inject(SeoService);
        })
    ]);
}
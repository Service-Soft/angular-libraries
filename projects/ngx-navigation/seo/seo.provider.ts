import { EnvironmentInjector, EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer, REQUEST_CONTEXT } from '@angular/core';
import { Router } from '@angular/router';

import { SeoConfigChanges } from './seo-config-changes.model';
import { SeoConfig } from './seo-config.model';
import { SEO_CONFIG } from './seo-config.provider';
import { SeoRouteUtilities } from './seo-route.utilities';
import { SeoService } from './seo.service';

/**
 * Writes what each page tells search engines and AI assistants about itself into the head of the document, on every
 * navigation and on the server too, so the prerendered html holds it: the description, the canonical url, the
 * structured data, the robots, the og tags of a shared link and, for a site in several languages, the url of the page
 * in each of them, from the NavRouteData of its routes. On the server, it also hands SeoServerUtilities.resolvePages of
 * `@service-soft/ngx-navigation/seo-server` the routes of the pages, with what their data.sitemap lists. Provide it in
 * the application config:
 * `provideSeoConfig({ origin: 'https://example.com' })`, with `locales` for a site Angular i18n builds in several
 * languages.
 * @param config - The origin of the site, a default image and the languages if you like.
 * @returns The providers for the SEO.
 */
export function provideSeoConfig(config: SeoConfigChanges): EnvironmentProviders {
    // no merging with a parent injector: the tags are the ones of the document, which only the root injector writes.
    const seoConfig: SeoConfig = {
        origin: config.origin.replace(/\/+$/, ''),
        defaultImage: config.defaultImage,
        locales: config.locales ?? []
    };
    return makeEnvironmentProviders([
        { provide: SEO_CONFIG, useValue: seoConfig },
        // before the first navigation, whose tags the service writes as well
        provideAppInitializer(async () => {
            inject(SeoService);
            // only the request resolvePages renders a page for has it, which nobody outside of the server can send
            const context: unknown = inject(REQUEST_CONTEXT);
            if (SeoRouteUtilities.isSitemapContext(context)) {
                // the page renders once they are done
                context.ngxSeoSitemap = await SeoRouteUtilities.resolveSitemapRoutes(inject(Router).config, inject(EnvironmentInjector));
            }
        })
    ]);
}
import { Data } from '@angular/router';

import { NavAnchor } from './nav-anchor.model';
import { NavBreadcrumbConfig } from './nav-breadcrumb-config.model';
import { NavSitemapEntry } from './nav-sitemap-entry.model';
import { NavStructuredData } from './nav-structured-data.type';

/**
 * What the navigation reads from the data of a route.
 */
export type NavRouteData = Data & {
    /**
     * The sections of the page the navigation links to, in a row below the navbar.
     */
    anchors?: NavAnchor[],
    /**
     * How the page shows in the breadcrumbs.
     */
    breadcrumb?: NavBreadcrumbConfig,
    /**
     * The text search engines show below the title of the page, and assistants read to know what is on it: one or two
     * sentences. Written as its meta description by provideSeoConfig of `@service-soft/ngx-navigation/seo`.
     */
    description?: string,
    /**
     * What the page is, for machines, written as its JSON-LD by provideSeoConfig.
     */
    structuredData?: NavStructuredData,
    /**
     * What search engines may do with the page, like 'noindex' for a thank-you page, written as its meta robots by
     * provideSeoConfig. A page with noindex is left out of the sitemap of `@service-soft/ngx-navigation/seo-server`.
     */
    robots?: string,
    /**
     * The image a shared link of the page shows, absolute or relative to the origin of provideSeoConfig, written as its
     * og:image.
     */
    image?: string,
    /**
     * When the content of the page last changed, which the sitemap of `@service-soft/ngx-navigation/seo-server` lists
     * in the format search engines read. A page without one has no date there.
     */
    lastModified?: Date,
    /**
     * The pages of a route with parameters, for the sitemap, like the products of an api. Runs in an injection context
     * of the app, as the server renders a page for the sitemap, so it can inject what it reads them with, like the
     * HttpClient; the providers of the root, not the ones of a route. Without it, only the pages Angular prerendered
     * for the route are listed.
     */
    sitemap?: () => Promise<NavSitemapEntry[]>
};
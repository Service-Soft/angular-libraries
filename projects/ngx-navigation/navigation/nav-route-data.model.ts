import { Data } from '@angular/router';

import { NavAnchor } from './nav-anchor.model';
import { NavBreadcrumbConfig } from './nav-breadcrumb-config.model';
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
     * provideSeoConfig.
     */
    robots?: string,
    /**
     * The image a shared link of the page shows, absolute or relative to the origin of provideSeoConfig, written as its
     * og:image.
     */
    image?: string
};
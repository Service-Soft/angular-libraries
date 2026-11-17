import { Data } from '@angular/router';

import { NavAnchor } from './nav-anchor.model';
import { NavBreadcrumbConfig } from './nav-breadcrumb-config.model';

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
    breadcrumb?: NavBreadcrumbConfig
};
import { ResolveFn, Route } from '@angular/router';

import { NavRouteData } from './nav-route-data.model';

/**
 * A route of Angular that requires the title and the path, as the navigation shows the one and links to the other,
 * with typed data. Routes like this can be defined right in the elements of the navigation and collected with
 * NavigationUtilities.resolveRoutes.
 */
export type NavRoute<Data extends NavRouteData = NavRouteData> = Route & {
    /**
     * The title of the page, which is also the name of its step in the breadcrumbs.
     */
    title: string | ResolveFn<string>,
    /**
     * The path of the route.
     */
    path: string,
    /**
     * What the navigation reads from the route, like the anchors of the page, and anything else.
     */
    data?: Data
};
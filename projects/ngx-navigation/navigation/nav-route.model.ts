import { ResolveFn } from '@angular/router';

import { NavChildRoute } from './nav-child-route.model';
import { NavRouteData } from './nav-route-data.model';

/**
 * A route of Angular that requires the title and the path, as the navigation shows the one and links to the other,
 * with typed data, also in its children. Routes like this can be defined right in the elements of the navigation and
 * collected with NavigationUtilities.resolveRoutes.
 */
export type NavRoute<Data extends NavRouteData = NavRouteData> = NavChildRoute<Data> & {
    /**
     * The title of the page, which is also the name of its step in the breadcrumbs.
     */
    title: string | ResolveFn<string>,
    /**
     * The path of the route.
     */
    path: string
};
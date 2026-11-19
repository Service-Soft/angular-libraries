import { Route } from '@angular/router';

import { NavRouteData } from './nav-route-data.model';

/**
 * A route below a NavRoute, with the same typed data, and children like it. Unlike a NavRoute, it needs no title and
 * no path, like a route that only redirects.
 */
export type NavChildRoute<Data extends NavRouteData = NavRouteData> = Omit<Route, 'data' | 'children'> & {
    /**
     * What the navigation reads from the route, like the anchors of the page, and anything else.
     */
    data?: Data,
    /**
     * The routes below it.
     */
    children?: NavChildRoute<Data>[]
};
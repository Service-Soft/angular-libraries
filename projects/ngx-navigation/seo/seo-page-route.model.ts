import { NavRouteData } from '@service-soft/ngx-navigation/navigation';

/**
 * A route of the router config that renders a page, with the path of its parents and the data of all of them.
 */
export type SeoPageRoute = {
    /**
     * The path of the route below the start page, like 'teams/:team', '' for the start page.
     */
    path: string,
    /**
     * Its data, with the data of its parents below it, like the router merges it.
     */
    data: NavRouteData
};
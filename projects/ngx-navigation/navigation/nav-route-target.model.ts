import { NavRoute } from './nav-route.model';

/**
 * Where a link inside the app goes.
 */
export type NavRouteTarget = {
    /**
     * The route, as its path like 'orders', or as the whole route, which NavigationUtilities.resolveRoutes then
     * collects for the router.
     */
    route: NavRoute | string,
    /**
     * The id of a section of the page to scroll to, without the '#'.
     */
    fragment?: string,
    /**
     * Whether the link opens in a new tab.
     */
    openInNewTab?: boolean
};
import { NavRouteCondition } from './nav-route-condition.type';

/**
 * The texts of the navigation that every part of it shares.
 */
export type NavigationLabels = {
    /**
     * The name of the first step of the breadcrumbs, the start page.
     */
    home: string,
    /**
     * What screen readers call the links to the sections of the current page.
     */
    anchors: string
};

/**
 * What every part of the navigation shares.
 */
export type NavigationConfig = {
    /**
     * The texts.
     */
    labels: NavigationLabels,
    /**
     * Whether a link to a route of the app is shown, checked for the route and every parent of it. Shows every link by
     * default.
     */
    routeCondition: NavRouteCondition
};

/**
 * The values to change in the config of the navigation. Everything is optional, including every single label.
 */
export type NavigationConfigChanges = {
    /**
     * The texts to change.
     */
    labels?: Partial<NavigationLabels>,
    /**
     * Whether a link to a route of the app is shown, checked for the route and every parent of it, like
     * `route => inject(AuthService).hasRoutePermissions(route.data ?? {})` of `@service-soft/ngx-auth`. The `condition`
     * of the link has to pass as well.
     */
    routeCondition?: NavRouteCondition
};
import { ActivatedRouteSnapshot } from '@angular/router';
import { IconDefinition } from '@service-soft/ui/icon';

/**
 * How a page shows in the breadcrumbs.
 */
export type NavBreadcrumbConfig = {
    /**
     * The name of its step, the title of the route when there is none. A function gets the route, like to show the
     * name of the order of the url, and runs in an injection context.
     */
    name?: string | ((route: ActivatedRouteSnapshot) => string),
    /**
     * An icon in front of the name.
     */
    icon?: IconDefinition,
    /**
     * The path of a top level route to show as the step before this one, for a page whose route isn't a child of that
     * one, like 'orders' for 'orders/:id'.
     */
    parent?: string
};
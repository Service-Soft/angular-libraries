import { NavRouteTarget } from './nav-route-target.model';
import { NavUrlTarget } from './nav-url-target.model';

/**
 * Where a link goes: a route of the app, or the url of another site.
 */
export type NavTarget = NavRouteTarget | NavUrlTarget;
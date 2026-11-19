import { Route } from '@angular/router';

/**
 * Whether a link to a route of the app is shown, like only when the user may open it. It runs in an injection context,
 * so it can use inject(), and the link follows the signals it reads.
 * @param route - The route of the link, and each of its parents in turn.
 * @returns Whether the link may show.
 */
export type NavRouteCondition = (route: Route) => boolean;
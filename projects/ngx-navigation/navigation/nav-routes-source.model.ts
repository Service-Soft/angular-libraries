import { Route } from '@angular/router';

import { FooterRow } from './footer-row.model';
import { NavbarRow } from './navbar-row.model';

/**
 * Where NavigationUtilities.resolveRoutes collects the routes from.
 */
export type NavRoutesSource = {
    /**
     * The rows of the navbar, whose elements may define routes.
     */
    navbarRows?: NavbarRow[],
    /**
     * The rows of the footer, whose elements may define routes.
     */
    footerRows?: FooterRow[],
    /**
     * Routes that are in no element, like the page of an order or the one for unknown urls. They come after the ones
     * of the elements, so a route for every path ('**') stays last.
     */
    routes?: Route[]
};
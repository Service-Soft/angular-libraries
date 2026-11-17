import { IsActiveMatchOptions } from '@angular/router';

/**
 * The attributes of the `<a>` of a link: a routerLink for a route of the app, an href for another site.
 */
export type NavLinkView = {
    /**
     * The absolute url of the route, for a link inside the app.
     */
    routerLink?: string,
    /**
     * When a link inside the app is the current page, which it then tells screen readers: on its path, and its
     * fragment if it has one.
     */
    activeOptions?: IsActiveMatchOptions,
    /**
     * The url, for a link to another site.
     */
    href?: string,
    /**
     * The id of the section of the page to scroll to.
     */
    fragment?: string,
    /**
     * '_blank' for a link that opens in a new tab.
     */
    target?: '_blank',
    /**
     * Keeps a page opened in a new tab from reaching this one.
     */
    rel?: 'noopener noreferrer'
};
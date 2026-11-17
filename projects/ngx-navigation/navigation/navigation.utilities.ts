import { Injector, runInInjectionContext } from '@angular/core';
import { Route } from '@angular/router';

import { NavConditional } from './nav-conditional.model';
import { NavElement } from './nav-element.type';
import { NavLinkView } from './nav-link-view.model';
import { NavMenuElement } from './nav-menu.model';
import { NavPositionGroups } from './nav-position-groups.model';
import { NavRoute } from './nav-route.model';
import { NavRoutesSource } from './nav-routes-source.model';
import { NavTarget } from './nav-target.type';

/**
 * Utilities for the routes the navigation links to.
 */
export abstract class NavigationUtilities {
    /**
     * Collects the routes that are defined in the elements of the navbar and the footer, including the ones in menus,
     * for the router: `provideRouter(NavigationUtilities.resolveRoutes({ navbarRows, footerRows, routes }))`. A path that
     * is there several times is kept once, the first time it comes, like the router would use it.
     * @param source - The rows and the routes that are in no element.
     * @returns The routes, those of the navbar first, then those of the footer, then the others.
     */
    static resolveRoutes(source: NavRoutesSource): Route[] {
        const elements: NavElement[] = [...source.navbarRows ?? [], ...source.footerRows ?? []].flatMap(row => row.elements);
        const routes: Route[] = [...NavigationUtilities.findRoutes(elements), ...source.routes ?? []];
        const paths: Set<string | undefined> = new Set();
        return routes.filter(route => {
            if (paths.has(route.path)) {
                return false;
            }
            paths.add(route.path);
            return true;
        });
    }

    /**
     * Gets the absolute url of a route, for a routerLink: '/orders' for the route or the path 'orders'.
     * @param route - The route, or its path.
     * @returns The url.
     */
    static getUrl(route: NavRoute | string): string {
        const path: string = typeof route === 'string' ? route : route.path;
        return path.startsWith('/') ? path : `/${path}`;
    }

    /**
     * Gets the attributes of the `<a>` of a link.
     * @param target - Where the link goes.
     * @returns A routerLink for a route of the app, an href for another site.
     */
    static getLinkView(target: NavTarget): NavLinkView {
        const newTab: Pick<NavLinkView, 'target' | 'rel'> = target.openInNewTab === true
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {};
        if ('url' in target) {
            return { href: target.url, ...newTab };
        }
        return {
            routerLink: NavigationUtilities.getUrl(target.route),
            fragment: target.fragment,
            activeOptions: {
                paths: 'exact',
                queryParams: 'ignored',
                matrixParams: 'ignored',
                fragment: target.fragment == undefined ? 'ignored' : 'exact'
            },
            ...newTab
        };
    }

    /**
     * Finds the elements whose condition holds, running each in the injection context of the given injector. Called in
     * a computed, it follows the signals the conditions read.
     * @param elements - The elements.
     * @param injector - What the conditions inject from.
     * @returns The elements to show.
     */
    static findShown<T extends NavConditional>(elements: T[], injector: Injector): T[] {
        return elements.filter(element => element.condition == undefined || runInInjectionContext(injector, element.condition));
    }

    /**
     * Groups the elements of a row by where in the row they are, at the start when they don't say.
     * @param elements - The elements of the row.
     * @returns The elements at the start, in the center and at the end, each in their order.
     */
    static groupByPosition<T extends Pick<NavElement, 'position'>>(elements: T[]): NavPositionGroups<T> {
        return {
            start: elements.filter(element => element.position == undefined || element.position === 'start'),
            center: elements.filter(element => element.position === 'center'),
            end: elements.filter(element => element.position === 'end')
        };
    }

    private static findRoutes(elements: (NavElement | NavMenuElement)[]): NavRoute[] {
        return elements.flatMap(element => {
            switch (element.type) {
                case 'menu': {
                    return NavigationUtilities.findRoutes(element.elements);
                }
                case 'link': {
                    return NavigationUtilities.findRoute(element);
                }
                case 'title':
                case 'image': {
                    return NavigationUtilities.findRoute(element.link);
                }
                case 'button':
                case 'text':
                case 'custom': {
                    return [];
                }
            }
        });
    }

    private static findRoute(target: NavTarget | undefined): NavRoute[] {
        return target == undefined || !('route' in target) || typeof target.route === 'string' ? [] : [target.route];
    }
}
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Route, Routes } from '@angular/router';
import { NavRouteData, NavSitemapEntry } from '@service-soft/ngx-navigation/navigation';

import { SeoPageRoute } from './seo-page-route.model';
import { SeoSitemapContext } from './seo-sitemap-context.model';

/**
 * Finds the pages of the routes of an app, the same way in the app and on its server, which lists them for the
 * sitemap.
 */
export abstract class SeoRouteUtilities {
    /**
     * Finds the routes that render a page search engines may index, depth first: children and lazily loaded children
     * included, without redirects, without the route of unknown urls and matchers, and without routes whose data.robots
     * holds noindex.
     * @param routes - The routes of the app, the same that provideRouter gets.
     * @returns The routes of the pages, by their whole path.
     */
    static async findPageRoutes(routes: Routes): Promise<SeoPageRoute[]> {
        return this.findChildPageRoutes(routes, '', {});
    }

    /**
     * Resolves the pages that the data.sitemap of each route lists, in an injection context of the app, so they can
     * inject what they read them with, like the HttpClient.
     * @param routes - The routes of the app.
     * @param injector - The injector of the app.
     * @returns The pages, by the path of their route, like 'news/:article'.
     */
    static async resolveListedPages(routes: Routes, injector: EnvironmentInjector): Promise<Record<string, NavSitemapEntry[]>> {
        const listed: Record<string, NavSitemapEntry[]> = {};
        for (const route of await this.findPageRoutes(routes)) {
            const sitemap: NavRouteData['sitemap'] = route.data.sitemap;
            if (sitemap != undefined) {
                listed[route.path] = await runInInjectionContext(injector, sitemap);
            }
        }
        return listed;
    }

    /**
     * Whether the REQUEST_CONTEXT of a request is the one SeoServerUtilities.resolvePages renders a page with, to run
     * the data.sitemap of the routes.
     * @param context - The REQUEST_CONTEXT, null in the browser and for a page rendered for any other request.
     * @returns Whether it is.
     */
    static isSitemapContext(context: unknown): context is SeoSitemapContext {
        return typeof context === 'object' && context != undefined && 'ngxSeoSitemap' in context;
    }

    private static async findChildPageRoutes(routes: Routes, parentPath: string, parentData: NavRouteData): Promise<SeoPageRoute[]> {
        const pages: SeoPageRoute[] = [];
        for (const route of routes) {
            if (route.redirectTo != undefined || route.path?.includes('**') === true || route.matcher != undefined) {
                continue;
            }
            const routePath: string = [parentPath, route.path ?? ''].filter(segment => segment !== '').join('/');
            const data: NavRouteData = { ...parentData, ...route.data };
            if (data.robots?.toLowerCase().includes('noindex') === true) {
                continue;
            }
            if (route.component != undefined || route.loadComponent != undefined) {
                pages.push({ path: routePath, data });
            }
            pages.push(...await this.findChildPageRoutes(await this.resolveChildren(route), routePath, data));
        }
        // a parent with a component and a child of the empty path render the same page
        return [...new Map(pages.map(page => [page.path, page])).values()];
    }

    private static async resolveChildren(route: Route): Promise<Routes> {
        if (route.children != undefined) {
            return route.children;
        }
        if (route.loadChildren == undefined) {
            return [];
        }
        const loaded: unknown = await route.loadChildren();
        // the routes themselves, or the module that exports them as its default
        if (Array.isArray(loaded)) {
            return loaded as Routes;
        }
        const exported: unknown = typeof loaded === 'object' && loaded != undefined && 'default' in loaded ? loaded.default : undefined;
        return Array.isArray(exported) ? exported as Routes : [];
    }
}
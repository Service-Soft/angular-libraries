import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Route, Routes } from '@angular/router';
import { NavRouteData } from '@service-soft/ngx-navigation/navigation';

import { SeoPageRoute } from './seo-page-route.model';
import { SeoSitemapContext } from './seo-sitemap-context.model';
import { SeoSitemapRoute } from './seo-sitemap-route.model';

/**
 * Finds the pages of the routes of an app, in the app, which hands them to its server for the sitemap. The server
 * can't import the routes itself: in a site in several languages their texts are $localize, which only the build of
 * each language fills in.
 */
export abstract class SeoRouteUtilities {
    /**
     * Resolves the routes that render a page search engines may index, depth first: children and lazily loaded children
     * included, without redirects, without the route of unknown urls and matchers, and without routes whose data.robots
     * holds noindex. Each with the pages its data.sitemap lists, which runs in an injection context of the app, so it
     * can inject what it reads them with, like the HttpClient.
     * @param routes - The routes of the app, the same that provideRouter gets.
     * @param injector - The injector of the app.
     * @returns The routes of the pages, by their whole path.
     */
    static async resolveSitemapRoutes(routes: Routes, injector: EnvironmentInjector): Promise<SeoSitemapRoute[]> {
        const sitemapRoutes: SeoSitemapRoute[] = [];
        for (const route of await this.findChildPageRoutes(routes, '', {})) {
            const sitemap: NavRouteData['sitemap'] = route.data.sitemap;
            sitemapRoutes.push({ ...route, listed: sitemap == undefined ? undefined : await runInInjectionContext(injector, sitemap) });
        }
        return sitemapRoutes;
    }

    /**
     * Whether the REQUEST_CONTEXT of a request is the one SeoServerUtilities.resolvePages renders a page with, to get
     * the routes of the pages.
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
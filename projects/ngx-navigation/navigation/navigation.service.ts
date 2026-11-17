import { computed, EnvironmentInjector, inject, Injectable, runInInjectionContext, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Data, NavigationEnd, Route, Router, RouterStateSnapshot } from '@angular/router';
import { filter, map } from 'rxjs';

import { NavAnchor } from './nav-anchor.model';
import { NavBreadcrumbConfig } from './nav-breadcrumb-config.model';
import { NavBreadcrumb } from './nav-breadcrumb.model';
import { NavRouteData } from './nav-route-data.model';
import { NavigationConfig } from './navigation-config.model';
import { NAVIGATION_CONFIG } from './navigation-config.provider';

/**
 * A step of the breadcrumbs before it knows whether it is the current page.
 */
type NavBreadcrumbStep = Omit<NavBreadcrumb, 'isCurrent'>;

/**
 * What the navigation reads from the current route: the anchors of the page and its breadcrumbs. Both are signals that
 * follow every navigation.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
    private readonly router: Router = inject(Router);
    private readonly injector: EnvironmentInjector = inject(EnvironmentInjector);
    private readonly config: NavigationConfig = inject(NAVIGATION_CONFIG);

    // starts with the state the router has now, so a navigation that ended before anything injected this counts too.
    private readonly state: Signal<RouterStateSnapshot> = toSignal(
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            map(() => this.router.routerState.snapshot)
        ),
        { initialValue: this.router.routerState.snapshot }
    );

    /**
     * The url of the current page inside the app, with its query and fragment, like '/orders?page=2'.
     */
    readonly url: Signal<string> = computed(() => this.state().url);

    /**
     * The path of the current page, without its query and fragment, like '/orders/1001'.
     */
    readonly path: Signal<string> = computed(() => this.url().split(/[?#]/)[0] ?? '/');

    /**
     * The sections of the current page, from the anchors in the data of its route.
     */
    readonly anchors: Signal<NavAnchor[]> = computed(() => this.findData(this.findDeepest(this.state().root).data).anchors ?? []);

    /**
     * The way from the start page to the current one: a step for the start page and one for every route of the url,
     * the current page last. None on the page for unknown urls, whose route has the path '**'.
     */
    readonly breadcrumbs: Signal<NavBreadcrumb[]> = computed(() => this.resolveBreadcrumbs(this.state().root));

    private resolveBreadcrumbs(root: ActivatedRouteSnapshot): NavBreadcrumb[] {
        const steps: NavBreadcrumbStep[] = [{ name: this.config.labels.home, url: '/' }];
        let url: string = '';
        for (let route: ActivatedRouteSnapshot | null = root.firstChild; route != undefined; route = route.firstChild) {
            if (route.routeConfig?.path === '**') {
                return [];
            }
            // a route without a path of its own, like one that only groups others, is no step
            if (!route.url.length) {
                continue;
            }
            url = `${url}/${route.url.map(segment => segment.path).join('/')}`;
            // the own data of the route: the router hands the data of a route without a component on to its children,
            // which would give them its name.
            const config: NavBreadcrumbConfig | undefined = this.findData(route.routeConfig?.data).breadcrumb;
            const parentUrl: string | undefined = config?.parent == undefined ? undefined : `/${config.parent}`;
            if (parentUrl != undefined && !steps.some(step => step.url === parentUrl)) {
                steps.push(this.resolveParentStep(config?.parent ?? '', parentUrl));
            }
            steps.push({ name: this.resolveName(config, route), url, icon: config?.icon });
        }
        return steps.map((step, index) => ({ ...step, isCurrent: index === steps.length - 1 }));
    }

    private resolveParentStep(path: string, url: string): NavBreadcrumbStep {
        const parent: Route | undefined = this.router.config.find(route => route.path === path);
        const config: NavBreadcrumbConfig | undefined = this.findData(parent?.data).breadcrumb;
        // there is no snapshot of a route that isn't active, so only names and titles that are strings can be shown.
        const name: string | undefined = typeof config?.name === 'string' ? config.name : undefined;
        const title: string | undefined = typeof parent?.title === 'string' ? parent.title : undefined;
        return { name: name ?? title ?? path, url, icon: config?.icon };
    }

    private resolveName(config: NavBreadcrumbConfig | undefined, route: ActivatedRouteSnapshot): string {
        const name: NavBreadcrumbConfig['name'] = config?.name;
        if (typeof name === 'string') {
            return name;
        }
        return name == undefined
            ? route.title ?? route.url.map(segment => segment.path).join('/')
            : runInInjectionContext(this.injector, () => name(route));
    }

    private findDeepest(root: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
        let route: ActivatedRouteSnapshot = root;
        while (route.firstChild != undefined) {
            route = route.firstChild;
        }
        return route;
    }

    // the router types the data of every route as Data, which allows anything; the navigation only reads its own keys.
    private findData(data: Data | undefined): NavRouteData {
        return data ?? {};
    }
}
import { Component, inject, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { faBox } from '@fortawesome/free-solid-svg-icons';
import { describe, expect, test } from 'vitest';

import { NavBreadcrumb } from './nav-breadcrumb.model';
import { NavRouteData } from './nav-route-data.model';
import { provideNavigationConfig } from './navigation-config.provider';
import { NavigationService } from './navigation.service';

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

const ORDER_PREFIX: InjectionToken<string> = new InjectionToken<string>('ORDER_PREFIX', { providedIn: 'root', factory: () => 'Order' });

const ORDER_DATA: NavRouteData = {
    anchors: [{ name: 'Invoice', fragment: 'invoice' }],
    // the name of a step can come from the url, and inject what it needs
    breadcrumb: { parent: 'orders', name: route => `${inject(ORDER_PREFIX)} ${route.paramMap.get('id') ?? ''}` }
};

const ROUTES: Route[] = [
    { path: '', title: 'Start', component: PageComponent },
    { path: 'orders', title: 'Orders', component: PageComponent, data: { breadcrumb: { icon: faBox } } },
    { path: 'orders/:id', title: 'Order', component: PageComponent, data: ORDER_DATA },
    {
        path: 'settings',
        data: { breadcrumb: { name: 'Settings' } },
        children: [
            { path: '', title: 'Settings', component: PageComponent },
            { path: 'password', title: 'Password', component: PageComponent }
        ]
    },
    { path: '**', title: 'Not found', component: PageComponent }
];

async function navigate(url: string): Promise<[NavigationService, RouterTestingHarness]> {
    const harness: RouterTestingHarness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return [TestBed.inject(NavigationService), harness];
}

describe('NavigationService', () => {
    test('has a step for the start page and one for every route of the url, the current page last', async () => {
        TestBed.configureTestingModule({ providers: [provideRouter(ROUTES), provideNavigationConfig({ labels: { home: 'Shop' } })] });
        const [navigation] = await navigate('/settings/password');

        expect(navigation.breadcrumbs()).toEqual<NavBreadcrumb[]>([
            { name: 'Shop', url: '/', icon: undefined, isCurrent: false },
            { name: 'Settings', url: '/settings', icon: undefined, isCurrent: false },
            { name: 'Password', url: '/settings/password', icon: undefined, isCurrent: true }
        ]);
        expect(navigation.anchors()).toEqual([]);
    });

    test('puts the parent route in front, names steps by a function, and follows every navigation', async () => {
        TestBed.configureTestingModule({ providers: [provideRouter(ROUTES)] });
        const [navigation, harness] = await navigate('/orders/1001');

        expect(navigation.breadcrumbs()).toEqual<NavBreadcrumb[]>([
            { name: 'Home', url: '/', icon: undefined, isCurrent: false },
            { name: 'Orders', url: '/orders', icon: faBox, isCurrent: false },
            { name: 'Order 1001', url: '/orders/1001', icon: undefined, isCurrent: true }
        ]);
        expect(navigation.anchors()).toEqual(ORDER_DATA.anchors);

        await harness.navigateByUrl('/');
        expect(navigation.breadcrumbs()).toEqual<NavBreadcrumb[]>([{ name: 'Home', url: '/', isCurrent: true }]);
        expect(navigation.anchors()).toEqual([]);
    });

    test('has no breadcrumbs on the page for unknown urls', async () => {
        TestBed.configureTestingModule({ providers: [provideRouter(ROUTES)] });
        const [navigation] = await navigate('/somewhere/else');

        expect(navigation.breadcrumbs()).toEqual([]);
    });
});
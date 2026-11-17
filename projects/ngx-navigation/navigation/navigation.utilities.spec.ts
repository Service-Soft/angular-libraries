import { Component } from '@angular/core';
import { Route } from '@angular/router';
import { describe, expect, test } from 'vitest';

import { FooterRow } from './footer-row.model';
import { NavRoute } from './nav-route.model';
import { NavbarRow } from './navbar-row.model';
import { NavigationUtilities } from './navigation.utilities';

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

const HOME: NavRoute = { path: '', title: 'Home', component: PageComponent };
const ORDERS: NavRoute = { path: 'orders', title: 'Orders', component: PageComponent };
const PASSWORD: NavRoute = { path: 'settings/password', title: 'Password', component: PageComponent };
const IMPRINT: NavRoute = { path: 'imprint', title: 'Imprint', component: PageComponent };

describe('NavigationUtilities', () => {
    test('collects the routes of every element and menu, each path once, and the other routes after them', () => {
        const navbarRows: NavbarRow[] = [
            {
                elements: [
                    { type: 'title', title: 'Shop', link: { route: HOME } },
                    { type: 'link', name: 'Orders', route: ORDERS },
                    { type: 'link', name: 'Orders again', route: { ...ORDERS, title: 'Duplicate' } },
                    { type: 'link', name: 'Docs', url: 'https://example.com' },
                    { type: 'link', name: 'By path', route: 'orders' },
                    { type: 'menu', name: 'Settings', elements: [{ type: 'menu', name: 'Security', elements: [{ type: 'link', name: 'Password', route: PASSWORD }] }] },
                    { type: 'button', name: 'Log out', action: () => undefined }
                ]
            }
        ];
        const footerRows: FooterRow[] = [{ elements: [{ type: 'image', url: '/logo.svg', alt: 'Imprint', width: 40, height: 40, link: { route: IMPRINT } }] }];
        const notFound: Route = { path: '**', component: PageComponent };

        expect(NavigationUtilities.resolveRoutes({ navbarRows, footerRows, routes: [{ ...HOME, title: 'Also home' }, notFound] }))
            .toEqual([HOME, ORDERS, PASSWORD, IMPRINT, notFound]);
    });

    test('gets the absolute url of a route or a path', () => {
        expect(NavigationUtilities.getUrl(ORDERS)).toBe('/orders');
        expect(NavigationUtilities.getUrl('settings/password')).toBe('/settings/password');
        expect(NavigationUtilities.getUrl('/imprint')).toBe('/imprint');
        expect(NavigationUtilities.getUrl(HOME)).toBe('/');
    });
});
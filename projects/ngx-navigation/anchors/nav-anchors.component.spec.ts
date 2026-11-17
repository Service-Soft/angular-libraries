import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NavRouteData, provideNavigationConfig } from '@service-soft/ngx-navigation/navigation';
import { describe, expect, test } from 'vitest';

import { NavAnchorsComponent } from './nav-anchors.component';

@Component({ selector: 'ngx-page', template: '<ngx-nav-anchors />', imports: [NavAnchorsComponent] })
class PageComponent {}

const ORDERS_DATA: NavRouteData = { anchors: [{ name: 'Open', fragment: 'open' }, { name: 'Shipped', fragment: 'shipped' }] };

describe('NavAnchorsComponent', () => {
    test('links to the sections of the current page, and shows nothing on a page without', async () => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([{ path: 'orders', component: PageComponent, data: ORDERS_DATA }, { path: '**', component: PageComponent }]),
                provideNavigationConfig({ labels: { anchors: 'Sections' } })
            ]
        });
        const harness: RouterTestingHarness = await RouterTestingHarness.create();

        await harness.navigateByUrl('/start');
        expect(harness.routeNativeElement?.querySelector('nav')).toBeNull();

        await harness.navigateByUrl('/orders');
        const links: HTMLAnchorElement[] = [...harness.routeNativeElement?.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Sections"] a') ?? []];
        expect(links.map(link => [link.textContent.trim(), link.getAttribute('href')])).toEqual([
            ['Open', '/orders#open'],
            ['Shipped', '/orders#shipped']
        ]);
    });
});
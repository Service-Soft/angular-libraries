import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, test } from 'vitest';

import { BreadcrumbsComponent } from './breadcrumbs.component';

@Component({ selector: 'ngx-page', template: '<ngx-breadcrumbs />', imports: [BreadcrumbsComponent] })
class PageComponent {}

describe('BreadcrumbsComponent', () => {
    test('links every step of the current page, marks the last one as the current page, and shows nothing for unknown urls', async () => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'orders', title: 'Orders', component: PageComponent },
                    { path: 'orders/:id', title: 'Order', component: PageComponent, data: { breadcrumb: { parent: 'orders' } } },
                    { path: '**', component: PageComponent }
                ])
            ]
        });
        const harness: RouterTestingHarness = await RouterTestingHarness.create();
        await harness.navigateByUrl('/orders/1001');
        const links: HTMLAnchorElement[] = [...harness.routeNativeElement?.querySelectorAll<HTMLAnchorElement>('ui-breadcrumb a') ?? []];

        expect(links.map(link => [link.textContent.trim(), link.getAttribute('href'), link.getAttribute('aria-current') ?? undefined])).toEqual([
            ['Home', '/', undefined],
            ['Orders', '/orders', undefined],
            ['Order', '/orders/1001', 'page']
        ]);

        await harness.navigateByUrl('/unknown');
        expect(harness.routeNativeElement?.querySelector('ui-breadcrumbs')).toBeNull();
    });
});
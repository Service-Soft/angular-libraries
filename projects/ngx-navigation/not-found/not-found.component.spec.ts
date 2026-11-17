import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { faSignsPost } from '@fortawesome/free-solid-svg-icons';
import { describe, expect, test } from 'vitest';

import { provideNotFoundConfig } from './not-found-config.provider';
import { NotFoundRouteData } from './not-found-route-data.model';
import { NotFoundComponent } from './not-found.component';

const SHOP_DATA: NotFoundRouteData = { notFound: { title: 'No such product', homeRoute: '/shop' } };

describe('NotFoundComponent', () => {
    test('shows the values of the config, with the ones in the data of its route first', async () => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'shop/**', component: NotFoundComponent, data: SHOP_DATA },
                    { path: '**', component: NotFoundComponent }
                ]),
                provideNotFoundConfig({ homeLabel: 'Home' })
            ]
        });
        const harness: RouterTestingHarness = await RouterTestingHarness.create();

        await harness.navigateByUrl('/unknown');
        expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Page not found');
        expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/');
        expect(harness.routeNativeElement?.querySelector('a')?.textContent).toBe('Home');
        // a result with the icon of the config and the link back as its action
        expect(harness.routeNativeElement?.querySelector('ui-result svg path')?.getAttribute('d')).toBe(faSignsPost.icon[4]);
        expect(harness.routeNativeElement?.querySelector('ui-result-actions a')).not.toBeNull();

        await harness.navigateByUrl('/shop/unknown');
        expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('No such product');
        expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/shop');
    });
});
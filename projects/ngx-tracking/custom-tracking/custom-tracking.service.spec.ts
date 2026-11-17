import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component, Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { GdprCategory } from '@service-soft/ngx-tracking/consent';
import { afterEach, describe, expect, test } from 'vitest';

import { CustomTrackingService } from './custom-tracking.service';
import { TrackingVisit } from './tracking-visit.model';

@Service()
class ShopAnalyticsService extends CustomTrackingService {
    override readonly storageKey: string = 'shopAnalytics';
    override readonly gdprCategory: GdprCategory = GdprCategory.ENABLED_BY_DEFAULT;
    override readonly domain: string = 'shop.example.com';
    override readonly visitUrl: string = '/api/visits';
    override readonly eventUrl: string = '/api/events';
}

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

function setUp(): [ShopAnalyticsService, HttpTestingController, Router] {
    TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', component: PageComponent }])]
    });
    return [TestBed.inject(ShopAnalyticsService), TestBed.inject(HttpTestingController), TestBed.inject(Router)];
}

describe('CustomTrackingService', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('sends nothing before the user allowed it', async () => {
        const [shopAnalytics, http, router] = setUp();
        await router.navigateByUrl('/orders');
        await shopAnalytics.trackEvent({ name: 'Purchase', category: 'Shop', referrer: '/' });
        http.verify();
    });

    test('sends the visits of pages without their query, marking only the first one as first', async () => {
        const [shopAnalytics, http, router] = setUp();
        await shopAnalytics.enable();

        await router.navigateByUrl('/orders?page=2#top');
        await router.navigateByUrl('/orders/1');
        const visits: TrackingVisit[] = http.match('/api/visits').map(request => request.request.body as TrackingVisit);

        expect(visits).toEqual([
            { firstVisit: true, referrer: '/', targetSite: '/orders', domain: 'shop.example.com' },
            { firstVisit: false, referrer: '/', targetSite: '/orders/1', domain: 'shop.example.com' }
        ]);
    });

    test('sends events with the domain, and forgets the first visit once forbidden', async () => {
        const [shopAnalytics, http, router] = setUp();
        await shopAnalytics.enable();
        await router.navigateByUrl('/');
        http.expectOne('/api/visits').flush({});

        const sent: Promise<void> = shopAnalytics.trackEvent({ name: 'Purchase', category: 'Shop', referrer: '/' });
        const request: TestRequest = http.expectOne({ method: 'POST', url: '/api/events' });
        expect(request.request.body).toEqual({ name: 'Purchase', category: 'Shop', referrer: '/', domain: 'shop.example.com' });
        request.flush({});
        await sent;

        shopAnalytics.disable();
        expect(localStorage.getItem('shopAnalyticsFirstVisit')).toBeNull();
    });
});
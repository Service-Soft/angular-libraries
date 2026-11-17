import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, test } from 'vitest';

import { provideGoogleAnalytics } from './google-analytics-config.provider';
import { GoogleAnalyticsService } from './google-analytics.service';

/**
 * The globals Google Analytics uses, as the test reads them.
 */
type GoogleAnalyticsGlobals = {
    dataLayer?: IArguments[],
    gtag?: unknown,
    'ga-disable-G-TEST'?: boolean
};

function getGlobals(): GoogleAnalyticsGlobals {
    return window as GoogleAnalyticsGlobals;
}

// the commands gtag pushed, as arrays.
function getCommands(): unknown[][] {
    return (getGlobals().dataLayer ?? []).map(command => Array.from<unknown>(command));
}

function setUp(): GoogleAnalyticsService {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideGoogleAnalytics({ measurementId: 'G-TEST' })] });
    return TestBed.inject(GoogleAnalyticsService);
}

describe('GoogleAnalyticsService', () => {
    afterEach(() => {
        localStorage.clear();
        document.getElementById('google-analytics-script')?.remove();
        delete getGlobals().dataLayer;
        delete getGlobals().gtag;
        delete getGlobals()['ga-disable-G-TEST'];
    });

    test('loads nothing and sends nothing before the user allowed it', () => {
        setUp().trackEvent('purchase', { value: 10 });

        expect(document.getElementById('google-analytics-script')).toBeNull();
        expect(getGlobals().gtag).toBeUndefined();
    });

    test('loads gtag.js once allowed, sends the page view of the current page and then events', async () => {
        const googleAnalytics: GoogleAnalyticsService = setUp();
        await googleAnalytics.enable();
        googleAnalytics.trackEvent('purchase', { value: 10 });

        expect(document.getElementById('google-analytics-script')?.getAttribute('src'))
            .toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST');
        expect(getCommands().map(command => command.slice(0, 2))).toEqual([
            ['js', expect.any(Date)],
            ['config', 'G-TEST'],
            ['event', 'page_view'],
            ['event', 'purchase']
        ]);
        expect(getCommands()[1][2]).toEqual({ send_page_view: false });
        expect(getCommands()[3][2]).toEqual({ value: 10, send_to: 'G-TEST' });
    });

    test('stops sending once forbidden and removes its script', async () => {
        const googleAnalytics: GoogleAnalyticsService = setUp();
        await googleAnalytics.enable();
        googleAnalytics.disable();
        googleAnalytics.trackEvent('purchase');

        expect(getGlobals()['ga-disable-G-TEST']).toBe(true);
        expect(document.getElementById('google-analytics-script')).toBeNull();
        expect(getCommands().map(command => command[1])).not.toContain('purchase');
    });
});
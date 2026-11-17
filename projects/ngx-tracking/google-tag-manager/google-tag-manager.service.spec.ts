import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, test } from 'vitest';

import { provideGoogleTagManager } from './google-tag-manager-config.provider';
import { GoogleTagManagerService } from './google-tag-manager.service';

/**
 * The global Google Tag Manager uses, as the test reads it.
 */
type GoogleTagManagerGlobals = {
    dataLayer?: unknown[]
};

function getGlobals(): GoogleTagManagerGlobals {
    return window as GoogleTagManagerGlobals;
}

function setUp(): GoogleTagManagerService {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideGoogleTagManager({ containerId: 'GTM-TEST' })] });
    return TestBed.inject(GoogleTagManagerService);
}

describe('GoogleTagManagerService', () => {
    afterEach(() => {
        localStorage.clear();
        document.getElementById('google-tag-manager-script')?.remove();
        delete getGlobals().dataLayer;
    });

    test('loads nothing before the user allowed it', () => {
        setUp().trackEvent('purchase');
        expect(document.getElementById('google-tag-manager-script')).toBeNull();
        expect(getGlobals().dataLayer).toBeUndefined();
    });

    test('loads the container once allowed, also when Google Analytics created the data layer before', async () => {
        getGlobals().dataLayer = ['from Google Analytics'];
        const googleTagManager: GoogleTagManagerService = setUp();
        await googleTagManager.enable();
        googleTagManager.trackEvent('purchase', { value: 10 });

        expect(document.getElementById('google-tag-manager-script')?.getAttribute('src')).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-TEST');
        expect(getGlobals().dataLayer?.[1]).toMatchObject({ event: 'gtm.js' });
        expect(getGlobals().dataLayer?.filter((item, index) => index !== 1)).toEqual([
            'from Google Analytics',
            { event: 'page', pageName: location.href },
            { value: 10, event: 'purchase' }
        ]);
    });

    test('pushes nothing once forbidden and removes its script', async () => {
        const googleTagManager: GoogleTagManagerService = setUp();
        await googleTagManager.enable();
        googleTagManager.disable();
        googleTagManager.trackEvent('purchase');

        expect(document.getElementById('google-tag-manager-script')).toBeNull();
        expect(getGlobals().dataLayer).toHaveLength(2);
    });
});
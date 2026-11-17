import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, test } from 'vitest';

import { provideMetaPixel } from './meta-pixel-config.provider';
import { MetaPixelService } from './meta-pixel.service';

/**
 * The globals the Meta Pixel uses, as the test reads them.
 */
type MetaPixelGlobals = {
    fbq?: { queue: IArguments[] },
    _fbq?: unknown
};

function getGlobals(): MetaPixelGlobals {
    return window as MetaPixelGlobals;
}

// the commands sent to fbq, as arrays.
function getCommands(): unknown[][] {
    return (getGlobals().fbq?.queue ?? []).map(command => Array.from<unknown>(command));
}

function setUp(): MetaPixelService {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideMetaPixel({ pixelId: '1234' })] });
    return TestBed.inject(MetaPixelService);
}

describe('MetaPixelService', () => {
    afterEach(() => {
        localStorage.clear();
        document.getElementById('meta-pixel-script')?.remove();
        delete getGlobals().fbq;
        delete getGlobals()._fbq;
    });

    test('loads nothing and tracks nothing before the user allowed it, events included', () => {
        const metaPixel: MetaPixelService = setUp();
        metaPixel.trackEvent('Purchase', { value: 10, currency: 'EUR' });
        metaPixel.trackCustomEvent('Newsletter');

        expect(document.getElementById('meta-pixel-script')).toBeNull();
        expect(getGlobals().fbq).toBeUndefined();
    });

    test('loads fbevents.js once allowed, grants the consent and tracks the page view and events', async () => {
        const metaPixel: MetaPixelService = setUp();
        await metaPixel.enable();
        metaPixel.trackEvent('Purchase', { value: 10, currency: 'EUR' });

        expect(document.getElementById('meta-pixel-script')?.getAttribute('src')).toBe('https://connect.facebook.net/en_US/fbevents.js');
        expect(getCommands()).toEqual([
            ['init', '1234'],
            ['consent', 'grant'],
            ['track', 'PageView'],
            ['track', 'Purchase', { value: 10, currency: 'EUR' }]
        ]);
    });

    test('revokes the consent once forbidden, removes its script and tracks nothing more', async () => {
        const metaPixel: MetaPixelService = setUp();
        await metaPixel.enable();
        metaPixel.disable();
        metaPixel.trackCustomEvent('Newsletter');

        expect(getCommands().at(-1)).toEqual(['consent', 'revoke']);
        expect(document.getElementById('meta-pixel-script')).toBeNull();
    });
});
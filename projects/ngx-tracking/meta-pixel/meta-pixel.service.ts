import { inject, Service } from '@angular/core';
import { GdprCategory, ScriptService, TrackingService } from '@service-soft/ngx-tracking/consent';

import { MetaPixelConfig } from './meta-pixel-config.model';
import { META_PIXEL_CONFIG } from './meta-pixel-config.provider';
import { MetaPixelEventName } from './meta-pixel-event-name.type';
import { MetaPixelEventProperties } from './meta-pixel-event-properties.model';

const SCRIPT_ID: string = 'meta-pixel-script';

/**
 * The fbq function of the Meta Pixel, as its snippet sets it up before fbevents.js loaded.
 */
type MetaPixelFunction = ((...args: unknown[]) => void) & {
    /**
     * Set by fbevents.js once it loaded, which then handles the commands itself.
     */
    callMethod?: (...args: unknown[]) => void,
    /**
     * The commands sent before fbevents.js loaded.
     */
    queue: unknown[],
    /**
     * Whether the snippet ran, which fbevents.js checks.
     */
    loaded: boolean,
    /**
     * The version of the snippet.
     */
    version: string
};

/**
 * The globals the Meta Pixel uses. They are set up here, so no inline script is needed, which a content security
 * policy would have to allow.
 */
type MetaPixelWindow = Window & {
    /**
     * Sends a command to the pixel.
     */
    fbq?: MetaPixelFunction,
    /**
     * The same function, which fbevents.js looks for as well.
     */
    _fbq?: MetaPixelFunction
};

/**
 * Tracks page views and events with the Meta (Facebook) Pixel, once the user allowed it. Unchecked in the consent
 * dialog at first. Set the pixel id with provideMetaPixel.
 */
@Service()
export class MetaPixelService extends TrackingService {
    override readonly storageKey: string = 'metaPixel';

    override readonly gdprCategory: GdprCategory = GdprCategory.DISABLED_BY_DEFAULT;

    private readonly config: MetaPixelConfig = inject(META_PIXEL_CONFIG);

    private readonly scriptService: ScriptService = inject(ScriptService);

    /**
     * Allows the pixel, loads its script and tracks the page view of the page the user allowed it on.
     */
    override async enable(): Promise<void> {
        const wasEnabled: boolean = this.enabled();
        await super.enable();
        if (!this.isBrowser || wasEnabled) {
            return;
        }
        this.fbq('consent', 'grant');
        this.onNavigationEnd();
    }

    /**
     * Forbids the pixel: revokes the consent it was given, which stops it from sending anything, and removes its
     * script.
     */
    override disable(): void {
        super.disable();
        if (!this.isBrowser) {
            return;
        }
        this.getWindow().fbq?.('consent', 'revoke');
        this.scriptService.removeScript(SCRIPT_ID);
    }

    /**
     * Tracks one of the standard events of the pixel, while the tracking is allowed.
     * @param name - The event, like 'Purchase'.
     * @param properties - Its properties, like its value and currency.
     */
    trackEvent(name: MetaPixelEventName, properties?: MetaPixelEventProperties): void {
        if (this.isBrowser && this.enabled()) {
            this.fbq('track', name, properties);
        }
    }

    /**
     * Tracks an event of your own, while the tracking is allowed.
     * @param name - The name of the event.
     * @param properties - Its properties.
     */
    trackCustomEvent(name: string, properties?: MetaPixelEventProperties): void {
        if (this.isBrowser && this.enabled()) {
            this.fbq('trackCustom', name, properties);
        }
    }

    /**
     * Tracks the page view of the page that was opened.
     */
    protected override onNavigationEnd(): void {
        this.fbq('track', 'PageView');
    }

    // sets up fbq once, like the snippet of Meta, and loads fbevents.js. Commands sent before it loaded wait in the queue.
    private fbq(...args: unknown[]): void {
        const window: MetaPixelWindow = this.getWindow();
        if (!window.fbq) {
            window.fbq = this.createMetaPixelFunction();
            window._fbq ??= window.fbq;
            window.fbq('init', this.config.pixelId);
        }
        window.fbq(...args);
    }

    private createMetaPixelFunction(): MetaPixelFunction {
        const fbq: MetaPixelFunction = Object.assign(
            function(...args: unknown[]): void {
                if (fbq.callMethod) {
                    fbq.callMethod(...args);
                    return;
                }
                // fbevents.js works off arguments objects, like the snippet of Meta pushes them.

                fbq.queue.push(arguments);
            },
            { queue: [], loaded: true, version: '2.0' }
        );
        this.scriptService.loadScriptInBackground(SCRIPT_ID, 'https://connect.facebook.net/en_US/fbevents.js');
        return fbq;
    }

    private getWindow(): MetaPixelWindow {
        return window;
    }
}
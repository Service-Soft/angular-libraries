import { inject, Service } from '@angular/core';
import { GdprCategory, ScriptService, TrackingService } from '@service-soft/ngx-tracking/consent';

import { GoogleAnalyticsConfig } from './google-analytics-config.model';
import { GOOGLE_ANALYTICS_CONFIG } from './google-analytics-config.provider';

const SCRIPT_ID: string = 'google-analytics-script';

/**
 * The globals Google Analytics uses. They are set up here, so no inline script is needed, which a content security
 * policy would have to allow.
 */
type GoogleAnalyticsWindow = Window & {
    /**
     * The queue of commands, which gtag.js works off once it loaded.
     */
    dataLayer?: unknown[],
    /**
     * Sends a command to Google Analytics.
     */
    gtag?: (...args: unknown[]) => void
};

/**
 * Tracks page views and events with Google Analytics 4, once the user allowed it. Unchecked in the consent dialog at
 * first. Set the measurement id with provideGoogleAnalytics.
 */
@Service()
export class GoogleAnalyticsService extends TrackingService {
    override readonly storageKey: string = 'googleAnalytics';

    override readonly gdprCategory: GdprCategory = GdprCategory.DISABLED_BY_DEFAULT;

    private readonly config: GoogleAnalyticsConfig = inject(GOOGLE_ANALYTICS_CONFIG);

    private readonly scriptService: ScriptService = inject(ScriptService);

    /**
     * Allows Google Analytics, loads its script and sends the page view of the page the user allowed it on.
     */
    override async enable(): Promise<void> {
        const wasEnabled: boolean = this.enabled();
        await super.enable();
        if (this.isBrowser && !wasEnabled) {
            this.onNavigationEnd();
        }
    }

    /**
     * Forbids Google Analytics: stops it from sending anything and removes its script. Its cookies stay until they
     * expire.
     */
    override disable(): void {
        super.disable();
        if (!this.isBrowser) {
            return;
        }
        // the opt-out flag of Google Analytics, which stops the gtag.js that already runs on this page.
        this.setDisabledFlag(true);
        this.scriptService.removeScript(SCRIPT_ID);
    }

    /**
     * Sends an event, while the tracking is allowed.
     * @param name - The name of the event, like 'purchase'.
     * @param parameters - The parameters of the event, like its value and currency.
     */
    trackEvent(name: string, parameters: Record<string, unknown> = {}): void {
        if (this.isBrowser && this.enabled()) {
            this.load();
            this.gtag('event', name, { ...parameters, send_to: this.config.measurementId });
        }
    }

    /**
     * Sends the page view of the page that was opened.
     */
    // sent here for every page, the first one included: Google Analytics would only send the first one itself, and an
    // app that navigates without loading pages has to send the others anyway.
    protected override onNavigationEnd(): void {
        this.load();
        this.gtag('event', 'page_view', {
            page_location: location.href,
            page_title: document.title,
            send_to: this.config.measurementId
        });
    }

    // queues the setup and loads gtag.js once. Commands sent before it loaded wait in the data layer.
    private load(): void {
        this.setDisabledFlag(false);
        const window: GoogleAnalyticsWindow = this.getWindow();
        if (window.gtag) {
            return;
        }
        window.dataLayer ??= [];
        const dataLayer: unknown[] = window.dataLayer;
        // gtag.js only works off arguments objects, not arrays, like the snippet of Google pushes them.
        window.gtag = function gtag(): void {

            dataLayer.push(arguments);
        };
        this.gtag('js', new Date());
        // page views are sent on every navigation instead, also for the first page.
        this.gtag('config', this.config.measurementId, { send_page_view: false });
        this.scriptService.loadScriptInBackground(SCRIPT_ID, `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`);
    }

    private gtag(...args: unknown[]): void {
        this.getWindow().gtag?.(...args);
    }

    // the name of the flag contains the measurement id, so it can't be part of the type of the window.
    private setDisabledFlag(disabled: boolean): void {
        Object.assign(window, { [`ga-disable-${this.config.measurementId}`]: disabled });
    }

    private getWindow(): GoogleAnalyticsWindow {
        return window;
    }
}
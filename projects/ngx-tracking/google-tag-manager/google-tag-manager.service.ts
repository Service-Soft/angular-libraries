import { inject, Service } from '@angular/core';
import { GdprCategory, ScriptService, TrackingService } from '@service-soft/ngx-tracking/consent';

import { GoogleTagManagerConfig } from './google-tag-manager-config.model';
import { GOOGLE_TAG_MANAGER_CONFIG } from './google-tag-manager-config.provider';

const SCRIPT_ID: string = 'google-tag-manager-script';

/**
 * The global Google Tag Manager works off.
 */
type GoogleTagManagerWindow = Window & {
    /**
     * The queue of events, which gtm.js works off once it loaded.
     */
    dataLayer?: unknown[]
};

/**
 * Loads a Google Tag Manager container and pushes page views and events to its data layer, once the user allowed it.
 * Unchecked in the consent dialog at first. Set the container id with provideGoogleTagManager.
 */
@Service()
export class GoogleTagManagerService extends TrackingService {
    override readonly storageKey: string = 'googleTagManager';

    override readonly gdprCategory: GdprCategory = GdprCategory.DISABLED_BY_DEFAULT;

    private readonly config: GoogleTagManagerConfig = inject(GOOGLE_TAG_MANAGER_CONFIG);

    private readonly scriptService: ScriptService = inject(ScriptService);

    // stays true once gtm.js ran: removing its script doesn't unload it.
    private loaded: boolean = false;

    /**
     * Allows Google Tag Manager, loads the container and pushes the page view of the page the user allowed it on.
     */
    override async enable(): Promise<void> {
        const wasEnabled: boolean = this.enabled();
        await super.enable();
        if (this.isBrowser && !wasEnabled) {
            this.onNavigationEnd();
        }
    }

    /**
     * Forbids Google Tag Manager and removes its script. The tags the container already started keep running until
     * the page loads again.
     */
    override disable(): void {
        super.disable();
        this.scriptService.removeScript(SCRIPT_ID);
    }

    /**
     * Pushes an event to the data layer, while the tracking is allowed.
     * @param name - The name of the event, like 'purchase'.
     * @param data - What else to push with it.
     */
    trackEvent(name: string, data: Record<string, unknown> = {}): void {
        if (this.isBrowser && this.enabled()) {
            this.push({ ...data, event: name });
        }
    }

    /**
     * Pushes the page view of the page that was opened.
     */
    protected override onNavigationEnd(): void {
        this.push({ event: 'page', pageName: location.href });
    }

    // loads gtm.js once, which works off what was pushed before it loaded. Google Analytics uses the same data layer,
    // so it existing says nothing about whether gtm.js was loaded.
    private push(item: Record<string, unknown>): void {
        const window: GoogleTagManagerWindow = this.getWindow();
        window.dataLayer ??= [];
        if (!this.loaded) {
            this.loaded = true;
            window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
            this.scriptService.loadScriptInBackground(SCRIPT_ID, `https://www.googletagmanager.com/gtm.js?id=${this.config.containerId}`);
        }
        window.dataLayer.push(item);
    }

    private getWindow(): GoogleTagManagerWindow {
        return window;
    }
}
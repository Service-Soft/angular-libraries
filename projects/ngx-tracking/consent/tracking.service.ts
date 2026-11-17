import { isPlatformBrowser } from '@angular/common';
import { computed, inject, PLATFORM_ID, signal, Signal, WritableSignal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

import { GdprCategory } from './gdpr-category.enum';

/**
 * Whether a tracking is allowed, as it is stored in the browser.
 */
type StoredConsent = {
    /**
     * Whether the user allowed the tracking.
     */
    enabled: boolean
};

/**
 * The base of every tracking. It stores whether the user allowed it, and calls onNavigationEnd on every navigation,
 * but only while it is allowed. Extend it and list it in the trackings of provideTrackingConsent.
 */
export abstract class TrackingService {
    /**
     * The key in the localStorage under which it is stored whether the user allowed the tracking.
     */
    abstract readonly storageKey: string;

    /**
     * Whether the tracking needs consent, and whether it is checked in the consent dialog at first.
     */
    abstract readonly gdprCategory: GdprCategory;

    /**
     * Whether it runs in a browser. On the server nothing is tracked or stored.
     */
    protected readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

    // counts the consents stored by this service, so enabled reads the storage again after each of them, and only then.
    private readonly storedConsents: WritableSignal<number> = signal(0);

    // a computed rather than reading the storage here: storageKey and gdprCategory are fields of the subclass, which
    // aren't set yet while this constructor runs. It is first read later, when they are.
    /**
     * Whether the user allowed the tracking. A technically necessary one always is. A signal, so what depends on the
     * consent, like content a ui-consent-gate shows, follows a choice the user changes in the consent dialog right away.
     */
    readonly enabled: Signal<boolean> = computed(() => {
        this.storedConsents();
        return this.gdprCategory === GdprCategory.TECHNICAL_NECESSARY || (this.isBrowser && this.findStoredConsent()?.enabled === true);
    });

    constructor() {
        inject(Router).events.subscribe(event => {
            if (event instanceof NavigationEnd && this.isBrowser && this.enabled()) {
                void this.onNavigationEnd(event);
            }
        });
    }

    /**
     * Allows the tracking. Override it to start tracking, like loading a script, and call super.enable() first.
     */
    async enable(): Promise<void> {
        this.storeConsent({ enabled: true });
        await Promise.resolve();
    }

    /**
     * Forbids the tracking, unless it is technically necessary. Override it to stop tracking and delete what it
     * stored, and call super.disable() first.
     */
    disable(): void {
        if (this.gdprCategory !== GdprCategory.TECHNICAL_NECESSARY) {
            this.storeConsent({ enabled: false });
        }
    }

    /**
     * Tracks a navigation, like a page view. Only called while the tracking is allowed, and only in the browser.
     * @param event - The navigation that ended.
     */
    protected abstract onNavigationEnd(event: NavigationEnd): void | Promise<void>;

    private storeConsent(consent: StoredConsent): void {
        if (this.isBrowser) {
            localStorage.setItem(this.storageKey, JSON.stringify(consent));
            this.storedConsents.update(count => count + 1);
        }
    }

    private findStoredConsent(): StoredConsent | undefined {
        const stored: string | null = localStorage.getItem(this.storageKey);
        if (stored == undefined) {
            return undefined;
        }
        try {
            return JSON.parse(stored) as StoredConsent;
        }
        catch {
            // stored by something else under the same key: the user didn't allow anything here.
            return undefined;
        }
    }
}
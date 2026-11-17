import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { TrackingService } from '@service-soft/ngx-tracking/consent';
import { firstValueFrom } from 'rxjs';

import { TrackingEvent } from './tracking-event.model';
import { TrackingVisit } from './tracking-visit.model';

// a month, like before the migration.
const ONE_MONTH: number = 2_629_746_000;

/**
 * A tracking that sends the visits of pages and events to your own backend. Extend it, set the urls and the domain,
 * and list it in the trackings of provideTrackingConsent.
 */
export abstract class CustomTrackingService<Event extends TrackingEvent = TrackingEvent> extends TrackingService {
    /**
     * The domain of the website, sent with every visit and event.
     */
    abstract readonly domain: string;

    /**
     * The url every visit of a page is sent to with a POST request.
     */
    abstract readonly visitUrl: string;

    /**
     * The url every event is sent to with a POST request.
     */
    abstract readonly eventUrl: string;

    /**
     * How long a visitor counts as known after their first visit, in milliseconds.
     */
    readonly firstVisitDuration: number = ONE_MONTH;

    /**
     * Sends the visits and events.
     */
    protected readonly http: HttpClient = inject(HttpClient);

    private readonly document: Document = inject(DOCUMENT);

    private get firstVisitKey(): string {
        return `${this.storageKey}FirstVisit`;
    }

    /**
     * Forbids the tracking and deletes when the visitor came first.
     */
    override disable(): void {
        super.disable();
        if (this.isBrowser) {
            localStorage.removeItem(this.firstVisitKey);
        }
    }

    /**
     * Sends an event, while the tracking is allowed.
     * @param event - What happened, without the domain.
     */
    async trackEvent(event: Omit<Event, 'domain'>): Promise<void> {
        if (!this.isBrowser || !this.enabled()) {
            return;
        }
        await this.send(this.eventUrl, { ...event, domain: this.domain });
    }

    /**
     * Sends the visit of the page that was opened.
     * @param event - The navigation that ended.
     */
    protected override async onNavigationEnd(event: NavigationEnd): Promise<void> {
        const visit: TrackingVisit = {
            firstVisit: this.resolveFirstVisit(),
            referrer: this.formatUrl(this.document.referrer),
            targetSite: this.formatUrl(event.urlAfterRedirects),
            domain: this.domain
        };
        await this.send(this.visitUrl, visit);
    }

    /**
     * Formats a url for a visit or event. By default it removes the protocol, 'www.', the query and the hash.
     * @param url - The url.
     * @returns The formatted url, or '/' when there is none.
     */
    protected formatUrl(url: string): string {
        return url.length <= 1
            ? '/'
            : url.replace(/^https?:\/\//, '').replace(/^www\./, '')
                .split(/[?#]/)[0];
    }

    // a failed request is no reason to bother the user, so it only goes to the console.
    private async send(url: string, body: object): Promise<void> {
        try {
            await firstValueFrom(this.http.post(url, body));
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error('Sending the tracking failed:', error);
        }
    }

    // true for the first visit, and again once the first visit duration passed since then.
    private resolveFirstVisit(): boolean {
        const firstVisit: number = new Date(localStorage.getItem(this.firstVisitKey) ?? Number.NaN).getTime();
        if (Date.now() - firstVisit < this.firstVisitDuration) {
            return false;
        }
        localStorage.setItem(this.firstVisitKey, new Date().toISOString());
        return true;
    }
}
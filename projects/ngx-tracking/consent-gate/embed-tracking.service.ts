import { GdprCategory, TrackingService } from '@service-soft/ngx-tracking/consent';

/**
 * The consent for embedded content of a third party, like Google Maps or YouTube, as a tracking the consent dialog asks
 * for. It tracks nothing itself: the content only loads where a ui-consent-gate with the ngxConsentTracking directive
 * shows it. Extend it with the storage key and list it in the trackings of provideTrackingConsent.
 */
export abstract class EmbedTrackingService extends TrackingService {
    /**
     * Unchecked in the consent dialog at first, like every content of a third party that needs consent.
     */
    override readonly gdprCategory: GdprCategory = GdprCategory.DISABLED_BY_DEFAULT;

    /**
     * Does nothing: the content loads with the page it is on.
     */
    protected override onNavigationEnd(): void {
        // the content of a third party sends what it sends when it loads, there is no visit to track.
    }
}
import { InjectionToken, Provider } from '@angular/core';

import { GoogleAnalyticsConfig } from './google-analytics-config.model';

/**
 * The Google Analytics property the GoogleAnalyticsService tracks for. Set it with provideGoogleAnalytics.
 */
export const GOOGLE_ANALYTICS_CONFIG: InjectionToken<GoogleAnalyticsConfig> = new InjectionToken<GoogleAnalyticsConfig>(
    'GOOGLE_ANALYTICS_CONFIG',
    {
        providedIn: 'root',
        factory: () => {
            throw new Error('The GoogleAnalyticsService needs a measurement id. '
                + 'Add provideGoogleAnalytics({ measurementId }) to the providers of your app.');
        }
    }
);

/**
 * Sets the Google Analytics property the GoogleAnalyticsService tracks for. Provide it in the application config.
 * @param config - The measurement id.
 * @returns The provider for GOOGLE_ANALYTICS_CONFIG.
 */
export function provideGoogleAnalytics(config: GoogleAnalyticsConfig): Provider {
    return { provide: GOOGLE_ANALYTICS_CONFIG, useValue: config };
}
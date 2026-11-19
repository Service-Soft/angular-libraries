import { InjectionToken } from '@angular/core';

import { ConsentConfig } from './consent-config.model';

/**
 * Which trackings the user is asked about, and how. Set it with provideTrackingConsent.
 */
export const CONSENT_CONFIG: InjectionToken<ConsentConfig> = new InjectionToken<ConsentConfig>('CONSENT_CONFIG', {
    providedIn: 'root',
    factory: () => {
        throw new Error('The ConsentService needs to know the trackings to ask for. '
            + 'Add provideTrackingConsent({ trackings, ui }) to the providers of your app.');
    }
});
import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';

import { ConsentConfigChanges } from './consent-config-changes.model';
import { ConsentConfig } from './consent-config.model';

// a month, like before the migration. Users are asked again after it.
const ONE_MONTH: number = 2_629_746_000;

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

/**
 * Sets up the consent: which trackings the user is asked about, and what they see. Creates the service of every
 * tracking when the app starts, so they track from the first navigation on. Provide it in the application config.
 * @param config - The trackings, the ui and what to change about how the user is asked.
 * @returns The providers for the consent.
 */
export function provideTrackingConsent(config: ConsentConfigChanges): EnvironmentProviders {
    const consentConfig: ConsentConfig = { choicesDuration: ONE_MONTH, respectDoNotTrack: true, ...config };
    return makeEnvironmentProviders([
        { provide: CONSENT_CONFIG, useValue: consentConfig },
        provideAppInitializer(() => {
            for (const tracking of consentConfig.trackings) {
                inject(tracking.service);
            }
        })
    ]);
}
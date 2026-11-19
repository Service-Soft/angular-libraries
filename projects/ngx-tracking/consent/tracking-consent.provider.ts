import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';

import { ConsentConfigChanges } from './consent-config-changes.model';
import { ConsentConfig } from './consent-config.model';
import { CONSENT_CONFIG } from './consent-config.provider';
import { ConsentService } from './consent.service';

// a month, like before the migration. Users are asked again after it.
const ONE_MONTH: number = 2_629_746_000;

/**
 * Sets up the consent: which trackings the user is asked about, what they see, and when they are asked. Creates the
 * service of every tracking when the app starts, so they track from the first navigation on. Provide it in the
 * application config.
 * @param config - The trackings, the ui and what to change about how the user is asked.
 * @returns The providers for the consent.
 */
export function provideTrackingConsent(config: ConsentConfigChanges): EnvironmentProviders {
    const consentConfig: ConsentConfig = { choicesDuration: ONE_MONTH, respectDoNotTrack: true, askOn: undefined, ...config };
    return makeEnvironmentProviders([
        { provide: CONSENT_CONFIG, useValue: consentConfig },
        provideAppInitializer(() => {
            for (const tracking of consentConfig.trackings) {
                inject(tracking.service);
            }
            inject(ConsentService).startAsking();
        })
    ]);
}
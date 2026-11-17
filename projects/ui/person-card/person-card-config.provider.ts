import { inject, InjectionToken, Provider } from '@angular/core';

import { PersonCardConfig } from './person-card-config.model';

const DEFAULT_PERSON_CARD_CONFIG: PersonCardConfig = {
    layout: 'portrait',
    headingLevel: 3
};

/**
 * The values every person card below this injector uses when its inputs are not set.
 * Change them with providePersonCardConfig.
 */
export const PERSON_CARD_CONFIG: InjectionToken<PersonCardConfig> = new InjectionToken<PersonCardConfig>('PERSON_CARD_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_PERSON_CARD_CONFIG
});

/**
 * Changes the values person cards use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for PERSON_CARD_CONFIG.
 */
export function providePersonCardConfig(config: Partial<PersonCardConfig>): Provider {
    return {
        provide: PERSON_CARD_CONFIG,
        useFactory: (): PersonCardConfig => ({
            ...inject(PERSON_CARD_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_PERSON_CARD_CONFIG,
            ...config
        })
    };
}
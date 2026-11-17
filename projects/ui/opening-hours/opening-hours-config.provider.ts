import { inject, InjectionToken, Provider } from '@angular/core';

import { OpeningHoursConfig } from './opening-hours-config.model';

const DEFAULT_OPENING_HOURS_CONFIG: OpeningHoursConfig = {
    firstDayOfWeek: 1,
    group: false,
    status: true,
    microdata: true,
    timeZone: undefined,
    dayFormat: 'long',
    label: 'Opening hours',
    closedLabel: 'Closed',
    todayLabel: 'Today',
    openNowLabel: 'Open now',
    closedNowLabel: 'Closed now',
    toLabel: 'to'
};

/**
 * The values all opening hours below this injector use when their inputs are not set, and their texts.
 * Change them with provideOpeningHoursConfig.
 */
export const OPENING_HOURS_CONFIG: InjectionToken<OpeningHoursConfig> = new InjectionToken<OpeningHoursConfig>('OPENING_HOURS_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_OPENING_HOURS_CONFIG
});

/**
 * Changes the values opening hours use when their inputs are not set, and their texts, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for OPENING_HOURS_CONFIG.
 */
export function provideOpeningHoursConfig(config: Partial<OpeningHoursConfig>): Provider {
    return {
        provide: OPENING_HOURS_CONFIG,
        useFactory: (): OpeningHoursConfig => ({
            ...inject(OPENING_HOURS_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_OPENING_HOURS_CONFIG,
            ...config
        })
    };
}
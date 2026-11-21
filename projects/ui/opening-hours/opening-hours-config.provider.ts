import { inject, InjectionToken, Provider } from '@angular/core';

import { OpeningHoursConfig } from './opening-hours-config.model';

/**
 * The values of opening hours when nothing changes them. Their texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultOpeningHoursConfig(): OpeningHoursConfig {
    return {
        firstDayOfWeek: 1,
        group: false,
        status: true,
        microdata: true,
        timeZone: undefined,
        dayFormat: 'long',
        label: $localize`:@@ui.opening-hours.label:Opening hours`,
        closedLabel: $localize`:@@ui.opening-hours.closedLabel:Closed`,
        todayLabel: $localize`:@@ui.opening-hours.todayLabel:Today`,
        openNowLabel: $localize`:@@ui.opening-hours.openNowLabel:Open now`,
        closedNowLabel: $localize`:@@ui.opening-hours.closedNowLabel:Closed now`,
        toLabel: $localize`:@@ui.opening-hours.toLabel:to`
    };
}

/**
 * The values all opening hours below this injector use when their inputs are not set, and their texts.
 * Change them with provideOpeningHoursConfig.
 */
export const OPENING_HOURS_CONFIG: InjectionToken<OpeningHoursConfig> = new InjectionToken<OpeningHoursConfig>('OPENING_HOURS_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultOpeningHoursConfig()
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
            ...inject(OPENING_HOURS_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultOpeningHoursConfig(),
            ...config
        })
    };
}
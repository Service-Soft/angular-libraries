import { inject, InjectionToken, Provider } from '@angular/core';

import { DatePeriodConfig } from './date-period-config.model';

/**
 * The values of a date period when nothing changes them. Its text for a period without an end is $localize, which an
 * app translates like its own texts, and resolved once the config is injected, so translations an app loads at runtime
 * apply as well.
 * @returns The default config.
 */
function getDefaultDatePeriodConfig(): DatePeriodConfig {
    return {
        format: { month: '2-digit', year: 'numeric' },
        openEndLabel: $localize`:@@ui.date-period.openEndLabel:today`,
        // an en dash, which stands for "to" in a range of dates
        separator: ' – '
    };
}

/**
 * The values every date period below this injector uses when its inputs or the arguments of its pipe are not set.
 * Change them with provideDatePeriodConfig.
 */
export const DATE_PERIOD_CONFIG: InjectionToken<DatePeriodConfig> = new InjectionToken<DatePeriodConfig>('DATE_PERIOD_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultDatePeriodConfig()
});

/**
 * Changes the values date periods use when their inputs or the arguments of their pipe are not set, like the format
 * or the openEndLabel to translate it.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for DATE_PERIOD_CONFIG.
 */
export function provideDatePeriodConfig(config: Partial<DatePeriodConfig>): Provider {
    return {
        provide: DATE_PERIOD_CONFIG,
        useFactory: (): DatePeriodConfig => ({
            ...inject(DATE_PERIOD_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultDatePeriodConfig(),
            ...config
        })
    };
}
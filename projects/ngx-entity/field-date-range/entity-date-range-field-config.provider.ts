import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityDateRangeFieldConfig } from './entity-date-range-field-config.model';

/**
 * The texts of the fields of date ranges when nothing changes them. They are $localize, which an app translates like
 * its own texts, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultEntityDateRangeFieldConfig(): EntityDateRangeFieldConfig {
    return {
        startLabel: $localize`:@@ngx-entity.field-date-range.startLabel:Start`,
        endLabel: $localize`:@@ngx-entity.field-date-range.endLabel:End`
    };
}

/**
 * The texts of every field of a date range below this injector. Change them with provideEntityDateRangeFieldConfig.
 */
export const ENTITY_DATE_RANGE_FIELD_CONFIG: InjectionToken<EntityDateRangeFieldConfig> = new InjectionToken<EntityDateRangeFieldConfig>(
    'ENTITY_DATE_RANGE_FIELD_CONFIG',
    { providedIn: 'root', factory: () => getDefaultEntityDateRangeFieldConfig() }
);

/**
 * Changes the texts of the fields of date ranges, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for ENTITY_DATE_RANGE_FIELD_CONFIG.
 */
export function provideEntityDateRangeFieldConfig(config: Partial<EntityDateRangeFieldConfig>): Provider {
    return {
        provide: ENTITY_DATE_RANGE_FIELD_CONFIG,
        useFactory: (): EntityDateRangeFieldConfig => ({
            ...inject(ENTITY_DATE_RANGE_FIELD_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultEntityDateRangeFieldConfig(),
            ...config
        })
    };
}
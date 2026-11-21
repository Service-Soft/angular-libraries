import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityArrayFieldConfig } from './entity-array-field-config.model';

/**
 * The texts of the tables of arrays when nothing changes them. They are $localize, which an app translates like its
 * own texts, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultEntityArrayFieldConfig(): EntityArrayFieldConfig {
    return {
        addLabel: $localize`:@@ngx-entity.field-base.addLabel:Add`,
        editLabel: $localize`:@@ngx-entity.field-base.editLabel:Edit`,
        removeLabel: $localize`:@@ngx-entity.field-base.removeLabel:Remove`,
        dateLabel: $localize`:@@ngx-entity.field-base.dateLabel:Date`,
        startLabel: $localize`:@@ngx-entity.field-base.startLabel:Start`,
        endLabel: $localize`:@@ngx-entity.field-base.endLabel:End`,
        addTitle: displayName => $localize`:@@ngx-entity.field-base.addTitle:Add to ${displayName}:displayName:`,
        editTitle: displayName => $localize`:@@ngx-entity.field-base.editTitle:Edit in ${displayName}:displayName:`,
        saveLabel: $localize`:@@ngx-entity.field-base.saveLabel:Save`,
        cancelLabel: $localize`:@@ngx-entity.field-base.cancelLabel:Cancel`,
        yesLabel: $localize`:@@ngx-entity.field-base.yesLabel:Yes`,
        noLabel: $localize`:@@ngx-entity.field-base.noLabel:No`
    };
}

/**
 * The texts of every table of an array in entity forms below this injector. Change them with
 * provideEntityArrayFieldConfig.
 */
export const ENTITY_ARRAY_FIELD_CONFIG: InjectionToken<EntityArrayFieldConfig> = new InjectionToken<EntityArrayFieldConfig>(
    'ENTITY_ARRAY_FIELD_CONFIG',
    { providedIn: 'root', factory: () => getDefaultEntityArrayFieldConfig() }
);

/**
 * Changes the texts of the tables of arrays of dates, date ranges and objects, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for ENTITY_ARRAY_FIELD_CONFIG.
 */
export function provideEntityArrayFieldConfig(config: Partial<EntityArrayFieldConfig>): Provider {
    return {
        provide: ENTITY_ARRAY_FIELD_CONFIG,
        useFactory: (): EntityArrayFieldConfig => ({
            ...inject(ENTITY_ARRAY_FIELD_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultEntityArrayFieldConfig(),
            ...config
        })
    };
}
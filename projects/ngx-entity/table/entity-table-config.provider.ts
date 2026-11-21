import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityTableConfig } from './entity-table-config.model';

/**
 * The texts of entity tables when nothing changes them. They are $localize, which an app translates like its own
 * texts, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultEntityTableConfig(): EntityTableConfig {
    return {
        yesLabel: $localize`:@@ngx-entity.table.yesLabel:Yes`,
        noLabel: $localize`:@@ngx-entity.table.noLabel:No`,
        createLabel: $localize`:@@ngx-entity.table.createLabel:Create`,
        deleteLabel: $localize`:@@ngx-entity.table.deleteLabel:Delete`,
        createFirstLabel: $localize`:@@ngx-entity.table.createFirstLabel:These can be added once this is saved.`,
        importLabel: $localize`:@@ngx-entity.table.importLabel:Import`,
        exportLabels: {
            json: $localize`:@@ngx-entity.table.exportLabels.json:Export as JSON`,
            csv: $localize`:@@ngx-entity.table.exportLabels.csv:Export as CSV`,
            xml: $localize`:@@ngx-entity.table.exportLabels.xml:Export as XML`
        },
        // the name of the file the user downloads, which they see.
        exportFileName: $localize`:@@ngx-entity.table.exportFileName:export`,
        csvSeparator: ','
    };
}

/**
 * The texts of every entity table below this injector. Change them with provideEntityTableConfig. The texts of the
 * table itself come from provideTableConfig of @service-soft/ui/table.
 */
export const ENTITY_TABLE_CONFIG: InjectionToken<EntityTableConfig> = new InjectionToken<EntityTableConfig>('ENTITY_TABLE_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultEntityTableConfig()
});

/**
 * Changes the texts of every entity table, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for ENTITY_TABLE_CONFIG.
 */
export function provideEntityTableConfig(config: Partial<EntityTableConfig>): Provider {
    return {
        provide: ENTITY_TABLE_CONFIG,
        useFactory: (): EntityTableConfig => ({
            ...inject(ENTITY_TABLE_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultEntityTableConfig(),
            ...config
        })
    };
}
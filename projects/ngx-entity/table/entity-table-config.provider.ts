import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityTableConfig } from './entity-table-config.model';

const DEFAULT_ENTITY_TABLE_CONFIG: EntityTableConfig = {
    yesLabel: 'Yes',
    noLabel: 'No',
    createLabel: 'Create',
    deleteLabel: 'Delete',
    createFirstLabel: 'These can be added once this is saved.',
    importLabel: 'Import',
    exportLabels: { json: 'Export as JSON', csv: 'Export as CSV', xml: 'Export as XML' },
    exportFileName: 'export',
    csvSeparator: ','
};

/**
 * The texts of every entity table below this injector. Change them with provideEntityTableConfig. The texts of the
 * table itself come from provideTableConfig of @service-soft/ui/table.
 */
export const ENTITY_TABLE_CONFIG: InjectionToken<EntityTableConfig> = new InjectionToken<EntityTableConfig>('ENTITY_TABLE_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_ENTITY_TABLE_CONFIG
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
            ...inject(ENTITY_TABLE_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_ENTITY_TABLE_CONFIG,
            ...config
        })
    };
}
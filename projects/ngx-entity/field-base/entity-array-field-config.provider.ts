import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityArrayFieldConfig } from './entity-array-field-config.model';

const DEFAULT_ENTITY_ARRAY_FIELD_CONFIG: EntityArrayFieldConfig = {
    addLabel: 'Add',
    editLabel: 'Edit',
    removeLabel: 'Remove',
    dateLabel: 'Date',
    startLabel: 'Start',
    endLabel: 'End',
    addTitle: displayName => `Add to ${displayName}`,
    editTitle: displayName => `Edit in ${displayName}`,
    saveLabel: 'Save',
    cancelLabel: 'Cancel',
    yesLabel: 'Yes',
    noLabel: 'No'
};

/**
 * The texts of every table of an array in entity forms below this injector. Change them with
 * provideEntityArrayFieldConfig.
 */
export const ENTITY_ARRAY_FIELD_CONFIG: InjectionToken<EntityArrayFieldConfig> = new InjectionToken<EntityArrayFieldConfig>(
    'ENTITY_ARRAY_FIELD_CONFIG',
    { providedIn: 'root', factory: () => DEFAULT_ENTITY_ARRAY_FIELD_CONFIG }
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
            ...inject(ENTITY_ARRAY_FIELD_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_ENTITY_ARRAY_FIELD_CONFIG,
            ...config
        })
    };
}
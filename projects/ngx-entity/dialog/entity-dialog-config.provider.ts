import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityDialogConfig } from './entity-dialog-config.model';

const DEFAULT_ENTITY_DIALOG_CONFIG: EntityDialogConfig = {
    deleteTitle: 'Delete this?',
    deleteParagraphs: ['This can\'t be undone.'],
    deleteLabel: 'Delete',
    keepLabel: 'Cancel'
};

/**
 * The texts of the question before deleting an entity, below this injector. Change them with
 * provideEntityDialogConfig.
 */
export const ENTITY_DIALOG_CONFIG: InjectionToken<EntityDialogConfig> = new InjectionToken<EntityDialogConfig>('ENTITY_DIALOG_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_ENTITY_DIALOG_CONFIG
});

/**
 * Changes the texts of the entity dialogs, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for ENTITY_DIALOG_CONFIG.
 */
export function provideEntityDialogConfig(config: Partial<EntityDialogConfig>): Provider {
    return {
        provide: ENTITY_DIALOG_CONFIG,
        useFactory: (): EntityDialogConfig => ({
            ...inject(ENTITY_DIALOG_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_ENTITY_DIALOG_CONFIG,
            ...config
        })
    };
}
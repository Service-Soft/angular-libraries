import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityFormConfig } from './entity-form-config.model';

const DEFAULT_ENTITY_FORM_CONFIG: EntityFormConfig = {
    // the first tab is where every field without a tab goes, so it is the one that is left unnamed without anyone
    // choosing to: it holds what the entity is about. Another tab was given its number on purpose, and should be named.
    tabLabel: tab => tab === 1 ? 'General' : `Tab ${tab}`,
    createTitle: 'Create',
    editTitle: 'Edit',
    saveLabel: 'Save',
    cancelLabel: 'Cancel'
};

/**
 * The texts of every entity form below this injector, and of the dialogs and pages they are in. Change them with
 * provideEntityFormConfig.
 */
export const ENTITY_FORM_CONFIG: InjectionToken<EntityFormConfig> = new InjectionToken<EntityFormConfig>('ENTITY_FORM_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_ENTITY_FORM_CONFIG
});

/**
 * Changes the texts of every entity form, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for ENTITY_FORM_CONFIG.
 */
export function provideEntityFormConfig(config: Partial<EntityFormConfig>): Provider {
    return {
        provide: ENTITY_FORM_CONFIG,
        useFactory: (): EntityFormConfig => ({
            ...inject(ENTITY_FORM_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_ENTITY_FORM_CONFIG,
            ...config
        })
    };
}
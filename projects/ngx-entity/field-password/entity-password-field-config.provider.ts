import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityPasswordFieldConfig } from './entity-password-field-config.model';

const DEFAULT_ENTITY_PASSWORD_FIELD_CONFIG: EntityPasswordFieldConfig = {
    confirmationLabel: displayName => `Repeat ${displayName}`,
    mismatchMessage: 'The passwords differ.'
};

/**
 * The texts of every field of a password below this injector. Change them with provideEntityPasswordFieldConfig.
 */
export const ENTITY_PASSWORD_FIELD_CONFIG: InjectionToken<EntityPasswordFieldConfig> = new InjectionToken<EntityPasswordFieldConfig>(
    'ENTITY_PASSWORD_FIELD_CONFIG',
    { providedIn: 'root', factory: () => DEFAULT_ENTITY_PASSWORD_FIELD_CONFIG }
);

/**
 * Changes the texts of the fields of passwords, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for ENTITY_PASSWORD_FIELD_CONFIG.
 */
export function provideEntityPasswordFieldConfig(config: Partial<EntityPasswordFieldConfig>): Provider {
    return {
        provide: ENTITY_PASSWORD_FIELD_CONFIG,
        useFactory: (): EntityPasswordFieldConfig => ({
            ...inject(ENTITY_PASSWORD_FIELD_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_ENTITY_PASSWORD_FIELD_CONFIG,
            ...config
        })
    };
}
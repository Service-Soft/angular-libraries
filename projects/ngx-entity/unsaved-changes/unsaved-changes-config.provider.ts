import { inject, InjectionToken, Provider } from '@angular/core';

import { UnsavedChangesConfig } from './unsaved-changes-config.model';

const DEFAULT_UNSAVED_CHANGES_CONFIG: UnsavedChangesConfig = {
    title: 'Discard your changes?',
    paragraphs: ['What you changed hasn\'t been saved and will be lost.'],
    discardLabel: 'Discard',
    keepEditingLabel: 'Keep editing'
};

/**
 * The texts of the question before changes are lost, below this injector. Change them with
 * provideUnsavedChangesConfig.
 */
export const UNSAVED_CHANGES_CONFIG: InjectionToken<UnsavedChangesConfig> = new InjectionToken<UnsavedChangesConfig>(
    'UNSAVED_CHANGES_CONFIG',
    { providedIn: 'root', factory: () => DEFAULT_UNSAVED_CHANGES_CONFIG }
);

/**
 * Changes the texts of the question before changes are lost, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for UNSAVED_CHANGES_CONFIG.
 */
export function provideUnsavedChangesConfig(config: Partial<UnsavedChangesConfig>): Provider {
    return {
        provide: UNSAVED_CHANGES_CONFIG,
        useFactory: (): UnsavedChangesConfig => ({
            ...inject(UNSAVED_CHANGES_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_UNSAVED_CHANGES_CONFIG,
            ...config
        })
    };
}
import { inject, InjectionToken, Provider } from '@angular/core';

import { UnsavedChangesConfig } from './unsaved-changes-config.model';

/**
 * The texts of the question before changes are lost when nothing changes them. They are $localize, which an app
 * translates like its own texts, and resolved once the config is injected, so translations an app loads at runtime
 * apply as well.
 * @returns The default config.
 */
function getDefaultUnsavedChangesConfig(): UnsavedChangesConfig {
    return {
        title: $localize`:@@ngx-entity.unsaved-changes.title:Discard your changes?`,
        paragraphs: [$localize`:@@ngx-entity.unsaved-changes.paragraphs:What you changed hasn't been saved and will be lost.`],
        discardLabel: $localize`:@@ngx-entity.unsaved-changes.discardLabel:Discard`,
        keepEditingLabel: $localize`:@@ngx-entity.unsaved-changes.keepEditingLabel:Keep editing`
    };
}

/**
 * The texts of the question before changes are lost, below this injector. Change them with
 * provideUnsavedChangesConfig.
 */
export const UNSAVED_CHANGES_CONFIG: InjectionToken<UnsavedChangesConfig> = new InjectionToken<UnsavedChangesConfig>(
    'UNSAVED_CHANGES_CONFIG',
    { providedIn: 'root', factory: () => getDefaultUnsavedChangesConfig() }
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
            ...inject(UNSAVED_CHANGES_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultUnsavedChangesConfig(),
            ...config
        })
    };
}
import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityDialogConfig } from './entity-dialog-config.model';

/**
 * The texts of the question before deleting an entity when nothing changes them. They are $localize, which an app
 * translates like its own texts, and resolved once the config is injected, so translations an app loads at runtime
 * apply as well.
 * @returns The default config.
 */
function getDefaultEntityDialogConfig(): EntityDialogConfig {
    return {
        deleteTitle: $localize`:@@ngx-entity.dialog.deleteTitle:Delete this?`,
        deleteParagraphs: [$localize`:@@ngx-entity.dialog.deleteParagraphs:This can't be undone.`],
        deleteLabel: $localize`:@@ngx-entity.dialog.deleteLabel:Delete`,
        keepLabel: $localize`:@@ngx-entity.dialog.keepLabel:Cancel`
    };
}

/**
 * The texts of the question before deleting an entity, below this injector. Change them with
 * provideEntityDialogConfig.
 */
export const ENTITY_DIALOG_CONFIG: InjectionToken<EntityDialogConfig> = new InjectionToken<EntityDialogConfig>('ENTITY_DIALOG_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultEntityDialogConfig()
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
            ...inject(ENTITY_DIALOG_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultEntityDialogConfig(),
            ...config
        })
    };
}
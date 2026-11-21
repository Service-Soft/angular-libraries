import { inject, InjectionToken, Provider } from '@angular/core';

import { EntityFormConfig } from './entity-form-config.model';

/**
 * The texts of entity forms when nothing changes them. They are $localize, which an app translates like its own texts,
 * and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultEntityFormConfig(): EntityFormConfig {
    return {
        // the first tab is where every field without a tab goes, so it is the one that is left unnamed without anyone
        // choosing to: it holds what the entity is about. Another tab was given its number on purpose, and should be named.
        tabLabel: tab => tab === 1
            ? $localize`:@@ngx-entity.form.tabLabel.first:General`
            : $localize`:@@ngx-entity.form.tabLabel.other:Tab ${tab}:tab:`,
        createTitle: $localize`:@@ngx-entity.form.createTitle:Create`,
        editTitle: $localize`:@@ngx-entity.form.editTitle:Edit`,
        saveLabel: $localize`:@@ngx-entity.form.saveLabel:Save`,
        cancelLabel: $localize`:@@ngx-entity.form.cancelLabel:Cancel`
    };
}

/**
 * The texts of every entity form below this injector, and of the dialogs and pages they are in. Change them with
 * provideEntityFormConfig.
 */
export const ENTITY_FORM_CONFIG: InjectionToken<EntityFormConfig> = new InjectionToken<EntityFormConfig>('ENTITY_FORM_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultEntityFormConfig()
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
            ...inject(ENTITY_FORM_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultEntityFormConfig(),
            ...config
        })
    };
}
import { inject, InjectionToken, Provider } from '@angular/core';

import { FootnotesConfig } from './footnotes-config.model';

/**
 * The texts of footnotes when nothing changes them. They are $localize, which an app translates like its own texts, and
 * resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultFootnotesConfig(): FootnotesConfig {
    return {
        label: $localize`:@@ui.footnotes.label:Footnotes`,
        referenceLabel: number => $localize`:@@ui.footnotes.referenceLabel:Footnote ${number}:number:`,
        backLabel: number => $localize`:@@ui.footnotes.backLabel:Back to reference ${number}:number:`
    };
}

/**
 * The texts every list of footnotes and every footnote below this injector uses.
 * Change them with provideFootnotesConfig.
 */
export const FOOTNOTES_CONFIG: InjectionToken<FootnotesConfig> = new InjectionToken<FootnotesConfig>('FOOTNOTES_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultFootnotesConfig()
});

/**
 * Changes the texts footnotes use, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for FOOTNOTES_CONFIG.
 */
export function provideFootnotesConfig(config: Partial<FootnotesConfig>): Provider {
    return {
        provide: FOOTNOTES_CONFIG,
        useFactory: (): FootnotesConfig => ({
            ...inject(FOOTNOTES_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultFootnotesConfig(),
            ...config
        })
    };
}
import { inject, InjectionToken, Provider } from '@angular/core';

import { FootnotesConfig } from './footnotes-config.model';

const DEFAULT_FOOTNOTES_CONFIG: FootnotesConfig = {
    label: 'Footnotes',
    referenceLabel: number => `Footnote ${number}`,
    backLabel: number => `Back to reference ${number}`
};

/**
 * The texts every list of footnotes and every footnote below this injector uses.
 * Change them with provideFootnotesConfig.
 */
export const FOOTNOTES_CONFIG: InjectionToken<FootnotesConfig> = new InjectionToken<FootnotesConfig>('FOOTNOTES_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_FOOTNOTES_CONFIG
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
            ...inject(FOOTNOTES_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_FOOTNOTES_CONFIG,
            ...config
        })
    };
}
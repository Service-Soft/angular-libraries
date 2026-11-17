import { inject, InjectionToken, Provider } from '@angular/core';

import { SectionConfig } from './section-config.model';

const DEFAULT_SECTION_CONFIG: SectionConfig = {
    level: 2,
    background: 'surface',
    align: 'start'
};

/**
 * The values every section below this injector uses when its inputs are not set.
 * Change them with provideSectionConfig.
 */
export const SECTION_CONFIG: InjectionToken<SectionConfig> = new InjectionToken<SectionConfig>('SECTION_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_SECTION_CONFIG
});

/**
 * Changes the values sections use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for SECTION_CONFIG.
 */
export function provideSectionConfig(config: Partial<SectionConfig>): Provider {
    return {
        provide: SECTION_CONFIG,
        useFactory: (): SectionConfig => ({
            ...inject(SECTION_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_SECTION_CONFIG,
            ...config
        })
    };
}
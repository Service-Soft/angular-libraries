import { inject, InjectionToken, Provider } from '@angular/core';

import { BylineConfig } from './byline-config.model';

const DEFAULT_BYLINE_CONFIG: BylineConfig = {
    showAvatar: false,
    dateFormat: { dateStyle: 'medium' },
    readingTimeLabel: minutes => `${minutes} min read`
};

/**
 * The values every byline below this injector uses when its inputs are not set.
 * Change them with provideBylineConfig.
 */
export const BYLINE_CONFIG: InjectionToken<BylineConfig> = new InjectionToken<BylineConfig>('BYLINE_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_BYLINE_CONFIG
});

/**
 * Changes the values bylines use when their inputs are not set, like the text of the reading time to translate it.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for BYLINE_CONFIG.
 */
export function provideBylineConfig(config: Partial<BylineConfig>): Provider {
    return {
        provide: BYLINE_CONFIG,
        useFactory: (): BylineConfig => ({
            ...inject(BYLINE_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_BYLINE_CONFIG,
            ...config
        })
    };
}
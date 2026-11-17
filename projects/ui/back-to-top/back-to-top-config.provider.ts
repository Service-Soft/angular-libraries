import { inject, InjectionToken, Provider } from '@angular/core';

import { BackToTopConfig } from './back-to-top-config.model';

const DEFAULT_BACK_TO_TOP_CONFIG: BackToTopConfig = {
    color: 'secondary',
    label: 'Back to top'
};

/**
 * The values every button below this injector that goes back to the top of the page uses when its inputs are not set,
 * and its texts. Change them with provideBackToTopConfig.
 */
export const BACK_TO_TOP_CONFIG: InjectionToken<BackToTopConfig> = new InjectionToken<BackToTopConfig>('BACK_TO_TOP_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_BACK_TO_TOP_CONFIG
});

/**
 * Changes the values the button that goes back to the top of the page uses, like its color or its texts to translate
 * them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for BACK_TO_TOP_CONFIG.
 */
export function provideBackToTopConfig(config: Partial<BackToTopConfig>): Provider {
    return {
        provide: BACK_TO_TOP_CONFIG,
        useFactory: (): BackToTopConfig => ({
            ...inject(BACK_TO_TOP_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_BACK_TO_TOP_CONFIG,
            ...config
        })
    };
}
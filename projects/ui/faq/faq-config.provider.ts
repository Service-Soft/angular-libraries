import { inject, InjectionToken, Provider } from '@angular/core';

import { FaqConfig } from './faq-config.model';

// plain, with a divider below each question, is the look of the questions of an FAQ.
const DEFAULT_FAQ_CONFIG: FaqConfig = {
    variant: 'plain',
    microdata: true,
    exclusive: false
};

/**
 * The values every list of frequently asked questions below this injector uses when its inputs are not set.
 * Change them with provideFaqConfig.
 */
export const FAQ_CONFIG: InjectionToken<FaqConfig> = new InjectionToken<FaqConfig>('FAQ_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_FAQ_CONFIG
});

/**
 * Changes the values lists of frequently asked questions use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for FAQ_CONFIG.
 */
export function provideFaqConfig(config: Partial<FaqConfig>): Provider {
    return {
        provide: FAQ_CONFIG,
        useFactory: (): FaqConfig => ({
            ...inject(FAQ_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_FAQ_CONFIG,
            ...config
        })
    };
}
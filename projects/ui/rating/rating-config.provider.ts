import { inject, InjectionToken, Provider } from '@angular/core';

import { RatingConfig } from './rating-config.model';

const DEFAULT_RATING_CONFIG: RatingConfig = {
    max: 5,
    label: (value, max) => `${value} out of ${max} stars`
};

/**
 * The values every rating below this injector uses when its inputs are not set, and its texts.
 * Change them with provideRatingConfig.
 */
export const RATING_CONFIG: InjectionToken<RatingConfig> = new InjectionToken<RatingConfig>('RATING_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_RATING_CONFIG
});

/**
 * Changes the values ratings use when their inputs are not set, and their texts, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for RATING_CONFIG.
 */
export function provideRatingConfig(config: Partial<RatingConfig>): Provider {
    return {
        provide: RATING_CONFIG,
        useFactory: (): RatingConfig => ({
            ...inject(RATING_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_RATING_CONFIG,
            ...config
        })
    };
}
import { inject, InjectionToken, Provider } from '@angular/core';

import { PriceConfig } from './price-config.model';

const DEFAULT_PRICE_CONFIG: PriceConfig = {
    currency: 'EUR',
    format: {},
    size: 'md',
    perLabel: 'per',
    oldPriceLabel: 'previously'
};

/**
 * The values every price below this injector uses when its inputs are not set.
 * Change them with providePriceConfig.
 */
export const PRICE_CONFIG: InjectionToken<PriceConfig> = new InjectionToken<PriceConfig>('PRICE_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_PRICE_CONFIG
});

/**
 * Changes the values prices use when their inputs are not set, like the currency and the texts screen readers read.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for PRICE_CONFIG.
 */
export function providePriceConfig(config: Partial<PriceConfig>): Provider {
    return {
        provide: PRICE_CONFIG,
        useFactory: (): PriceConfig => ({
            ...inject(PRICE_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_PRICE_CONFIG,
            ...config
        })
    };
}
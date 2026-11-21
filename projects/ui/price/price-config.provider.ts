import { inject, InjectionToken, Provider } from '@angular/core';

import { PriceConfig } from './price-config.model';

/**
 * The values of a price when nothing changes them. Its texts are $localize, which an app translates like its own, and
 * resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultPriceConfig(): PriceConfig {
    return {
        currency: 'EUR',
        format: {},
        size: 'md',
        perLabel: $localize`:@@ui.price.perLabel:per`,
        oldPriceLabel: $localize`:@@ui.price.oldPriceLabel:previously`
    };
}

/**
 * The values every price below this injector uses when its inputs are not set.
 * Change them with providePriceConfig.
 */
export const PRICE_CONFIG: InjectionToken<PriceConfig> = new InjectionToken<PriceConfig>('PRICE_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultPriceConfig()
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
            ...inject(PRICE_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultPriceConfig(),
            ...config
        })
    };
}
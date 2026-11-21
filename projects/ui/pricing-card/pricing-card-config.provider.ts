import { inject, InjectionToken, Provider } from '@angular/core';

import { PricingCardConfig } from './pricing-card-config.model';

/**
 * The values of a pricing card when nothing changes them. Its text of the badge is $localize, which an app translates
 * like its own texts, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultPricingCardConfig(): PricingCardConfig {
    return {
        // below the h2 of the section the plans are in.
        headingLevel: 3,
        badge: $localize`:@@ui.pricing-card.badge:Recommended`,
        highlightColor: 'primary'
    };
}

/**
 * The values every pricing card below this injector uses when its inputs are not set.
 * Change them with providePricingCardConfig.
 */
export const PRICING_CARD_CONFIG: InjectionToken<PricingCardConfig> = new InjectionToken<PricingCardConfig>('PRICING_CARD_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultPricingCardConfig()
});

/**
 * Changes the values pricing cards use when their inputs are not set, like the text of the badge of a highlighted plan.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for PRICING_CARD_CONFIG.
 */
export function providePricingCardConfig(config: Partial<PricingCardConfig>): Provider {
    return {
        provide: PRICING_CARD_CONFIG,
        useFactory: (): PricingCardConfig => ({
            ...inject(PRICING_CARD_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultPricingCardConfig(),
            ...config
        })
    };
}
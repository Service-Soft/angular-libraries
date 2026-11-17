import { inject, InjectionToken, Provider } from '@angular/core';

import { CardConfig } from './card-config.model';

const DEFAULT_CARD_CONFIG: CardConfig = {
    variant: 'elevated',
    color: 'neutral'
};

/**
 * The values every card below this injector uses when its inputs are not set.
 * Change them with provideCardConfig.
 */
export const CARD_CONFIG: InjectionToken<CardConfig> = new InjectionToken<CardConfig>('CARD_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_CARD_CONFIG
});

/**
 * Changes the values cards use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for CARD_CONFIG.
 */
export function provideCardConfig(config: Partial<CardConfig>): Provider {
    return {
        provide: CARD_CONFIG,
        useFactory: (): CardConfig => ({
            ...inject(CARD_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_CARD_CONFIG,
            ...config
        })
    };
}
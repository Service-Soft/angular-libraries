import { inject, InjectionToken, Provider } from '@angular/core';

import { ShowcaseCardConfig } from './showcase-card-config.model';

/**
 * The values of a showcase card when nothing changes them. Its label of the tags is $localize, which an app translates
 * like its own texts, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultShowcaseCardConfig(): ShowcaseCardConfig {
    return {
        headingLevel: 2,
        tagsLabel: $localize`:@@ui.showcase-card.tagsLabel:Tags`
    };
}

/**
 * The values every showcase card below this injector uses when its inputs are not set.
 * Change them with provideShowcaseCardConfig.
 */
export const SHOWCASE_CARD_CONFIG: InjectionToken<ShowcaseCardConfig> = new InjectionToken<ShowcaseCardConfig>('SHOWCASE_CARD_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultShowcaseCardConfig()
});

/**
 * Changes the values showcase cards use when their inputs are not set, like their texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for SHOWCASE_CARD_CONFIG.
 */
export function provideShowcaseCardConfig(config: Partial<ShowcaseCardConfig>): Provider {
    return {
        provide: SHOWCASE_CARD_CONFIG,
        useFactory: (): ShowcaseCardConfig => ({
            ...inject(SHOWCASE_CARD_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultShowcaseCardConfig(),
            ...config
        })
    };
}
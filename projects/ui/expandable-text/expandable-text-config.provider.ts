import { inject, InjectionToken, Provider } from '@angular/core';

import { ExpandableTextConfig } from './expandable-text-config.model';

const DEFAULT_EXPANDABLE_TEXT_CONFIG: ExpandableTextConfig = {
    lines: 3,
    moreLabel: 'Read more',
    lessLabel: 'Show less'
};

/**
 * The values every expandable text below this injector uses when its inputs are not set.
 * Change them with provideExpandableTextConfig.
 */
export const EXPANDABLE_TEXT_CONFIG: InjectionToken<ExpandableTextConfig> = new InjectionToken<ExpandableTextConfig>(
    'EXPANDABLE_TEXT_CONFIG',
    {
        providedIn: 'root',
        factory: () => DEFAULT_EXPANDABLE_TEXT_CONFIG
    }
);

/**
 * Changes the values expandable texts use when their inputs are not set, like the texts of the button to translate
 * them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for EXPANDABLE_TEXT_CONFIG.
 */
export function provideExpandableTextConfig(config: Partial<ExpandableTextConfig>): Provider {
    return {
        provide: EXPANDABLE_TEXT_CONFIG,
        useFactory: (): ExpandableTextConfig => ({
            ...inject(EXPANDABLE_TEXT_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_EXPANDABLE_TEXT_CONFIG,
            ...config
        })
    };
}
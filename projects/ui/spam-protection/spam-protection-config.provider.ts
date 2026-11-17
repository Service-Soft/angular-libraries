import { inject, InjectionToken, Provider } from '@angular/core';

import { SpamProtectionConfig } from './spam-protection-config.model';

// no minimum by default: a person who comes back to a form whose draft was kept may send it within a second.
const DEFAULT_SPAM_PROTECTION_CONFIG: SpamProtectionConfig = {
    name: 'website',
    label: 'Leave this field empty',
    minimumFillTime: 0
};

/**
 * The values every spam protection below this injector uses when its inputs are not set, and its texts.
 * Change them with provideSpamProtectionConfig.
 */
export const SPAM_PROTECTION_CONFIG: InjectionToken<SpamProtectionConfig> = new InjectionToken<SpamProtectionConfig>(
    'SPAM_PROTECTION_CONFIG',
    {
        providedIn: 'root',
        factory: () => DEFAULT_SPAM_PROTECTION_CONFIG
    }
);

/**
 * Changes the values spam protections use when their inputs are not set, and their texts.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for SPAM_PROTECTION_CONFIG.
 */
export function provideSpamProtectionConfig(config: Partial<SpamProtectionConfig>): Provider {
    return {
        provide: SPAM_PROTECTION_CONFIG,
        useFactory: (): SpamProtectionConfig => ({
            ...inject(SPAM_PROTECTION_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_SPAM_PROTECTION_CONFIG,
            ...config
        })
    };
}
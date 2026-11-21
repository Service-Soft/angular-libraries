import { inject, InjectionToken, Provider } from '@angular/core';

import { PrivacySettingsConfig } from './privacy-settings-config.model';

/**
 * The values of the button that opens the privacy settings when nothing changes them. Its label is $localize, which an
 * app translates like its own texts, and resolved once the config is injected, so translations an app loads at runtime
 * apply as well.
 * @returns The default config.
 */
function getDefaultPrivacySettingsConfig(): PrivacySettingsConfig {
    return {
        color: 'secondary',
        label: $localize`:@@ngx-tracking.privacy-settings.label:Privacy settings`
    };
}

/**
 * The values every button below this injector that opens the privacy settings uses when its inputs are not set, and
 * its texts. Change them with providePrivacySettingsConfig.
 */
export const PRIVACY_SETTINGS_CONFIG: InjectionToken<PrivacySettingsConfig> = new InjectionToken<PrivacySettingsConfig>(
    'PRIVACY_SETTINGS_CONFIG',
    {
        providedIn: 'root',
        factory: () => getDefaultPrivacySettingsConfig()
    }
);

/**
 * Changes the values the button that opens the privacy settings uses, like its color or its texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for PRIVACY_SETTINGS_CONFIG.
 */
export function providePrivacySettingsConfig(config: Partial<PrivacySettingsConfig>): Provider {
    return {
        provide: PRIVACY_SETTINGS_CONFIG,
        useFactory: (): PrivacySettingsConfig => ({
            ...inject(PRIVACY_SETTINGS_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultPrivacySettingsConfig(),
            ...config
        })
    };
}
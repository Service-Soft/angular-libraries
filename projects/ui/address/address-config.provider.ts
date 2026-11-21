import { inject, InjectionToken, Provider } from '@angular/core';

import { AddressConfig } from './address-config.model';

/**
 * The values of an address block when nothing changes them. Its texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultAddressConfig(): AddressConfig {
    return {
        icons: true,
        microdata: true,
        businessType: 'LocalBusiness',
        phoneLabel: $localize`:@@ui.address.phoneLabel:Phone`,
        faxLabel: $localize`:@@ui.address.faxLabel:Fax`,
        emailLabel: $localize`:@@ui.address.emailLabel:Email`
    };
}

/**
 * The values every address block below this injector uses when its inputs are not set, and its texts.
 * Change them with provideAddressConfig.
 */
export const ADDRESS_CONFIG: InjectionToken<AddressConfig> = new InjectionToken<AddressConfig>('ADDRESS_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultAddressConfig()
});

/**
 * Changes the values address blocks use when their inputs are not set, and their texts, like to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for ADDRESS_CONFIG.
 */
export function provideAddressConfig(config: Partial<AddressConfig>): Provider {
    return {
        provide: ADDRESS_CONFIG,
        useFactory: (): AddressConfig => ({
            ...inject(ADDRESS_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultAddressConfig(),
            ...config
        })
    };
}
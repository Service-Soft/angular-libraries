import { inject, InjectionToken, Provider } from '@angular/core';

import { AddressConfig } from './address-config.model';

const DEFAULT_ADDRESS_CONFIG: AddressConfig = {
    icons: true,
    microdata: true,
    businessType: 'LocalBusiness',
    phoneLabel: 'Phone',
    faxLabel: 'Fax',
    emailLabel: 'Email'
};

/**
 * The values every address block below this injector uses when its inputs are not set, and its texts.
 * Change them with provideAddressConfig.
 */
export const ADDRESS_CONFIG: InjectionToken<AddressConfig> = new InjectionToken<AddressConfig>('ADDRESS_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_ADDRESS_CONFIG
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
            ...inject(ADDRESS_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_ADDRESS_CONFIG,
            ...config
        })
    };
}
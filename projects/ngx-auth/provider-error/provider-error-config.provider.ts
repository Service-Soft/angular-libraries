import { inject, InjectionToken, Provider } from '@angular/core';

import { ProviderErrorConfigChanges } from './provider-error-config-changes.model';
import { ProviderErrorConfig } from './provider-error-config.model';

const DEFAULT_PROVIDER_ERROR_CONFIG: ProviderErrorConfig = {
    labels: {
        title: 'Logging in didn\'t work',
        // the errors zibri lands a failed login on its errorUrl with
        errors: {
            cancelled: 'You didn\'t allow the login at the provider.',
            provider_error: 'The provider didn\'t answer as expected. Please try again later.',
            expired: 'The login took too long, or was started in another browser. Please try again.',
            invalid: 'The answer of the provider couldn\'t be checked. Please try again.',
            already_linked: 'This account at the provider is connected to another user already.',
            not_for_login: 'This account at the provider can\'t be used to log in.',
            not_linked: 'The account of this login doesn\'t exist anymore.',
            refused: 'You can\'t log in with this account right now.',
            failed: 'Logging in didn\'t work. Please try again later.'
        },
        backToLogin: 'Back to the login',
        backToApp: 'Back'
    }
};

/**
 * What the page a failed login at a provider lands on shows. Change it with provideProviderErrorConfig.
 */
export const PROVIDER_ERROR_CONFIG: InjectionToken<ProviderErrorConfig> = new InjectionToken<ProviderErrorConfig>(
    'PROVIDER_ERROR_CONFIG',
    { providedIn: 'root', factory: () => DEFAULT_PROVIDER_ERROR_CONFIG }
);

/**
 * Changes what the page a failed login at a provider lands on shows, like its texts to translate them. Values you
 * leave out keep the ones of the parent injector, including single labels and errors.
 * @param config - The values to change.
 * @returns The provider for PROVIDER_ERROR_CONFIG.
 */
export function provideProviderErrorConfig(config: ProviderErrorConfigChanges): Provider {
    return {
        provide: PROVIDER_ERROR_CONFIG,
        useFactory: (): ProviderErrorConfig => {
            const parent: ProviderErrorConfig = inject(PROVIDER_ERROR_CONFIG, { skipSelf: true, optional: true })
                ?? DEFAULT_PROVIDER_ERROR_CONFIG;
            return { labels: { ...parent.labels, ...config.labels, errors: { ...parent.labels.errors, ...config.labels?.errors } } };
        }
    };
}
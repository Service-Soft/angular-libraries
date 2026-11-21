import { inject, InjectionToken, Provider } from '@angular/core';

import { ProviderErrorConfigChanges } from './provider-error-config-changes.model';
import { ProviderErrorConfig } from './provider-error-config.model';

/**
 * What the page a failed login at a provider lands on shows when nothing changes it. Its texts are $localize, which an
 * app translates like its own, and resolved once the config is injected, so translations an app loads at runtime apply
 * as well.
 * @returns The default config.
 */
function getDefaultProviderErrorConfig(): ProviderErrorConfig {
    return {
        labels: {
            title: $localize`:@@ngx-auth.provider-error.title:Logging in didn't work`,
            // the errors zibri lands a failed login on its errorUrl with
            errors: {
                cancelled: $localize`:@@ngx-auth.provider-error.errors.cancelled:You didn't allow the login at the provider.`,
                provider_error: $localize`:@@ngx-auth.provider-error.errors.provider_error:The provider didn't answer as expected. Please try again later.`,
                expired: $localize`:@@ngx-auth.provider-error.errors.expired:The login took too long, or was started in another browser. Please try again.`,
                invalid: $localize`:@@ngx-auth.provider-error.errors.invalid:The answer of the provider couldn't be checked. Please try again.`,
                already_linked: $localize`:@@ngx-auth.provider-error.errors.already_linked:This account at the provider is connected to another user already.`,
                not_for_login: $localize`:@@ngx-auth.provider-error.errors.not_for_login:This account at the provider can't be used to log in.`,
                not_linked: $localize`:@@ngx-auth.provider-error.errors.not_linked:The account of this login doesn't exist anymore.`,
                refused: $localize`:@@ngx-auth.provider-error.errors.refused:You can't log in with this account right now.`,
                failed: $localize`:@@ngx-auth.provider-error.errors.failed:Logging in didn't work. Please try again later.`
            },
            backToLogin: $localize`:@@ngx-auth.provider-error.backToLogin:Back to the login`,
            backToApp: $localize`:@@ngx-auth.provider-error.backToApp:Back`
        }
    };
}

/**
 * What the page a failed login at a provider lands on shows. Change it with provideProviderErrorConfig.
 */
export const PROVIDER_ERROR_CONFIG: InjectionToken<ProviderErrorConfig> = new InjectionToken<ProviderErrorConfig>(
    'PROVIDER_ERROR_CONFIG',
    { providedIn: 'root', factory: () => getDefaultProviderErrorConfig() }
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
                ?? getDefaultProviderErrorConfig();
            return { labels: { ...parent.labels, ...config.labels, errors: { ...parent.labels.errors, ...config.labels?.errors } } };
        }
    };
}
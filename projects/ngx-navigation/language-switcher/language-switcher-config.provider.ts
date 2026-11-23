import { inject, InjectionToken, Provider } from '@angular/core';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';

import { LanguageSwitcherConfig } from './language-switcher-config.model';

/**
 * The values of a language switcher when nothing changes them. Its label is $localize, which an app translates like
 * its own texts, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultLanguageSwitcherConfig(): LanguageSwitcherConfig {
    return {
        appearance: 'menu',
        label: $localize`:@@ngx-navigation.language-switcher.label:Language`,
        // characters of two scripts, the sign of language and translation, which a globe, the sign of a region or of
        // the web, is not
        icon: faLanguage,
        // a build for every language under its own path, like Angular's i18n makes them: /de/orders and /en/orders.
        href: (url, code, subPath) => `/${subPath}${url}`
    };
}

/**
 * The values every language switcher below this injector uses when its inputs are not set.
 * Change them with provideLanguageSwitcherConfig.
 */
export const LANGUAGE_SWITCHER_CONFIG: InjectionToken<LanguageSwitcherConfig> = new InjectionToken<LanguageSwitcherConfig>(
    'LANGUAGE_SWITCHER_CONFIG',
    {
        providedIn: 'root',
        factory: () => getDefaultLanguageSwitcherConfig()
    }
);

/**
 * Changes the values language switchers use when their inputs are not set, like the address of a page in another
 * language or the label to translate it.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for LANGUAGE_SWITCHER_CONFIG.
 */
export function provideLanguageSwitcherConfig(config: Partial<LanguageSwitcherConfig>): Provider {
    return {
        provide: LANGUAGE_SWITCHER_CONFIG,
        useFactory: (): LanguageSwitcherConfig => ({
            ...inject(LANGUAGE_SWITCHER_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultLanguageSwitcherConfig(),
            ...config
        })
    };
}
import { inject, InjectionToken, Provider } from '@angular/core';
import { faCircleHalfStroke, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

import { ThemeSwitcherConfig } from './theme-switcher-config.model';

/**
 * The values of a theme switcher when nothing changes them. Its texts are $localize, which an app translates like its
 * own texts, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultThemeSwitcherConfig(): ThemeSwitcherConfig {
    return {
        label: $localize`:@@ui.theme-switcher.label:Theme`,
        modeLabels: {
            system: $localize`:@@ui.theme-switcher.systemLabel:System`,
            light: $localize`:@@ui.theme-switcher.lightLabel:Light`,
            dark: $localize`:@@ui.theme-switcher.darkLabel:Dark`
        },
        modeIcons: {
            system: faCircleHalfStroke,
            light: faSun,
            dark: faMoon
        }
    };
}

/**
 * The values every theme switcher below this injector uses when its inputs are not set.
 * Change them with provideThemeSwitcherConfig.
 */
export const THEME_SWITCHER_CONFIG: InjectionToken<ThemeSwitcherConfig> = new InjectionToken<ThemeSwitcherConfig>(
    'THEME_SWITCHER_CONFIG',
    {
        providedIn: 'root',
        factory: () => getDefaultThemeSwitcherConfig()
    }
);

/**
 * Changes the values theme switchers use when their inputs are not set, like the names of the modes.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for THEME_SWITCHER_CONFIG.
 */
export function provideThemeSwitcherConfig(config: Partial<ThemeSwitcherConfig>): Provider {
    return {
        provide: THEME_SWITCHER_CONFIG,
        useFactory: (): ThemeSwitcherConfig => ({
            ...inject(THEME_SWITCHER_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultThemeSwitcherConfig(),
            ...config
        })
    };
}
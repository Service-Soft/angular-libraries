import { inject, InjectionToken, Provider } from '@angular/core';
import { faBars } from '@fortawesome/free-solid-svg-icons';

import { NavbarConfig, NavbarConfigChanges } from './navbar-config.model';

/**
 * The values of the navbar when nothing changes them. Its texts are $localize, which an app translates like its own,
 * and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultNavbarConfig(): NavbarConfig {
    return {
        labels: {
            navigation: $localize`:@@ngx-navigation.navbar.navigation:Navigation`,
            openNavigation: $localize`:@@ngx-navigation.navbar.openNavigation:Open the navigation`
        },
        collapse: 'sm',
        menuIcon: faBars
    };
}

/**
 * The values every navbar below this injector uses when its inputs or those of its elements are not set, and its texts.
 * Change them with provideNavbarConfig.
 */
export const NAVBAR_CONFIG: InjectionToken<NavbarConfig> = new InjectionToken<NavbarConfig>('NAVBAR_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultNavbarConfig()
});

/**
 * Changes the values the navbar uses when its inputs or those of its elements are not set, like the labels to
 * translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for NAVBAR_CONFIG.
 */
export function provideNavbarConfig(config: NavbarConfigChanges): Provider {
    return {
        provide: NAVBAR_CONFIG,
        useFactory: (): NavbarConfig => {
            const parent: NavbarConfig = inject(NAVBAR_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultNavbarConfig();
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
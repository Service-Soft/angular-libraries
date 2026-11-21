import { inject, InjectionToken, Provider } from '@angular/core';

import { NavigationConfig, NavigationConfigChanges } from './navigation-config.model';

/**
 * What the navigation shares when nothing changes it. Its texts are $localize, which an app translates like its own,
 * and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultNavigationConfig(): NavigationConfig {
    return {
        labels: {
            home: $localize`:@@ngx-navigation.navigation.home:Home`,
            anchors: $localize`:@@ngx-navigation.navigation.anchors:On this page`
        },
        routeCondition: () => true
    };
}

/**
 * What every part of the navigation below this injector shares, like its texts. Change it with provideNavigationConfig.
 */
export const NAVIGATION_CONFIG: InjectionToken<NavigationConfig> = new InjectionToken<NavigationConfig>('NAVIGATION_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultNavigationConfig()
});

/**
 * Changes what every part of the navigation shares, like the labels to translate them, or which links show.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for NAVIGATION_CONFIG.
 */
export function provideNavigationConfig(config: NavigationConfigChanges): Provider {
    return {
        provide: NAVIGATION_CONFIG,
        useFactory: (): NavigationConfig => {
            const parent: NavigationConfig = inject(NAVIGATION_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultNavigationConfig();
            return {
                ...parent,
                labels: { ...parent.labels, ...config.labels },
                routeCondition: config.routeCondition ?? parent.routeCondition
            };
        }
    };
}
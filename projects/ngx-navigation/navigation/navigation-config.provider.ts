import { inject, InjectionToken, Provider } from '@angular/core';

import { NavigationConfig, NavigationConfigChanges } from './navigation-config.model';

const DEFAULT_NAVIGATION_CONFIG: NavigationConfig = {
    labels: {
        home: 'Home',
        anchors: 'On this page'
    }
};

/**
 * What every part of the navigation below this injector shares, like its texts. Change it with provideNavigationConfig.
 */
export const NAVIGATION_CONFIG: InjectionToken<NavigationConfig> = new InjectionToken<NavigationConfig>('NAVIGATION_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_NAVIGATION_CONFIG
});

/**
 * Changes what every part of the navigation shares, like the labels to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for NAVIGATION_CONFIG.
 */
export function provideNavigationConfig(config: NavigationConfigChanges): Provider {
    return {
        provide: NAVIGATION_CONFIG,
        useFactory: (): NavigationConfig => {
            const parent: NavigationConfig = inject(NAVIGATION_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_NAVIGATION_CONFIG;
            return { ...parent, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
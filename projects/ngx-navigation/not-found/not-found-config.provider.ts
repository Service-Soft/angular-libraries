import { inject, InjectionToken, Provider } from '@angular/core';
import { faSignsPost } from '@fortawesome/free-solid-svg-icons';

import { NotFoundConfig } from './not-found-config.model';

/**
 * What the page for unknown urls shows when nothing changes it. Its texts are $localize, which an app translates like
 * its own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultNotFoundConfig(): NotFoundConfig {
    return {
        title: $localize`:@@ngx-navigation.not-found.title:Page not found`,
        message: $localize`:@@ngx-navigation.not-found.message:The page you are looking for might have been removed, had its name changed or is temporarily unavailable.`,
        homeLabel: $localize`:@@ngx-navigation.not-found.homeLabel:Back to the start page`,
        homeRoute: '/',
        icon: faSignsPost
    };
}

/**
 * What every page for unknown urls below this injector shows. Change it with provideNotFoundConfig.
 */
export const NOT_FOUND_CONFIG: InjectionToken<NotFoundConfig> = new InjectionToken<NotFoundConfig>('NOT_FOUND_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultNotFoundConfig()
});

/**
 * Changes what the page for unknown urls shows, like its texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for NOT_FOUND_CONFIG.
 */
export function provideNotFoundConfig(config: Partial<NotFoundConfig>): Provider {
    return {
        provide: NOT_FOUND_CONFIG,
        useFactory: (): NotFoundConfig => ({
            ...inject(NOT_FOUND_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultNotFoundConfig(),
            ...config
        })
    };
}
import { inject, InjectionToken, Provider } from '@angular/core';

import { SessionsConfigChanges } from './sessions-config-changes.model';
import { SessionsConfig } from './sessions-config.model';

const DEFAULT_SESSIONS_CONFIG: SessionsConfig = {
    labels: {
        title: 'Where you\'re logged in',
        thisDevice: 'this device',
        unknownBrowser: 'Unknown browser',
        lastUsedOn: date => `last used on ${date}`,
        logout: 'Log out',
        logoutEverywhere: 'Log out everywhere',
        logoutEverywhereTitle: 'Log out everywhere?',
        logoutEverywhereMessage: 'You are logged out on every device, this one too.',
        cancel: 'Cancel',
        loggedOut: 'Logged out there.',
        failed: 'Something went wrong. Please try again.'
    }
};

/**
 * What the list of where the logged in user is logged in shows. Change it with provideSessionsConfig.
 */
export const SESSIONS_CONFIG: InjectionToken<SessionsConfig> = new InjectionToken<SessionsConfig>('SESSIONS_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_SESSIONS_CONFIG
});

/**
 * Changes what the list of where the logged in user is logged in shows, like its texts to translate them. Values you
 * leave out keep the ones of the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for SESSIONS_CONFIG.
 */
export function provideSessionsConfig(config: SessionsConfigChanges): Provider {
    return {
        provide: SESSIONS_CONFIG,
        useFactory: (): SessionsConfig => {
            const parent: SessionsConfig = inject(SESSIONS_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_SESSIONS_CONFIG;
            return { labels: { ...parent.labels, ...config.labels } };
        }
    };
}
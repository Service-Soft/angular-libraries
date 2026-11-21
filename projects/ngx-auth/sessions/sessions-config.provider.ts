import { inject, InjectionToken, Provider } from '@angular/core';

import { SessionsConfigChanges } from './sessions-config-changes.model';
import { SessionsConfig } from './sessions-config.model';

/**
 * What the list of where the logged in user is logged in shows when nothing changes it. Its texts are $localize, which
 * an app translates like its own, and resolved once the config is injected, so translations an app loads at runtime
 * apply as well.
 * @returns The default config.
 */
function getDefaultSessionsConfig(): SessionsConfig {
    return {
        labels: {
            title: $localize`:@@ngx-auth.sessions.title:Where you're logged in`,
            thisDevice: $localize`:@@ngx-auth.sessions.thisDevice:this device`,
            unknownBrowser: $localize`:@@ngx-auth.sessions.unknownBrowser:Unknown browser`,
            lastUsedOn: date => $localize`:@@ngx-auth.sessions.lastUsedOn:last used on ${date}:date:`,
            logout: $localize`:@@ngx-auth.sessions.logout:Log out`,
            logoutEverywhere: $localize`:@@ngx-auth.sessions.logoutEverywhere:Log out everywhere`,
            logoutEverywhereTitle: $localize`:@@ngx-auth.sessions.logoutEverywhereTitle:Log out everywhere?`,
            logoutEverywhereMessage: $localize`:@@ngx-auth.sessions.logoutEverywhereMessage:You are logged out on every device, this one too.`,
            cancel: $localize`:@@ngx-auth.sessions.cancel:Cancel`,
            loggedOut: $localize`:@@ngx-auth.sessions.loggedOut:Logged out there.`,
            failed: $localize`:@@ngx-auth.sessions.failed:Something went wrong. Please try again.`
        }
    };
}

/**
 * What the list of where the logged in user is logged in shows. Change it with provideSessionsConfig.
 */
export const SESSIONS_CONFIG: InjectionToken<SessionsConfig> = new InjectionToken<SessionsConfig>('SESSIONS_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultSessionsConfig()
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
            const parent: SessionsConfig = inject(SESSIONS_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultSessionsConfig();
            return { labels: { ...parent.labels, ...config.labels } };
        }
    };
}
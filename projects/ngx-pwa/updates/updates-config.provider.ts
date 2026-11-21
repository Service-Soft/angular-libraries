import { InjectionToken, Provider } from '@angular/core';

import { UpdatesConfigChanges } from './updates-config-changes.model';
import { UpdatesConfig } from './updates-config.model';

/**
 * How the user is told about a new version of the app when nothing changes it. Its texts are $localize, which an app
 * translates like its own, and resolved once the config is injected, so translations an app loads at runtime apply as
 * well.
 * @returns The default config.
 */
function getDefaultUpdatesConfig(): UpdatesConfig {
    return {
        labels: {
            newVersionTitle: $localize`:@@ngx-pwa.updates.newVersionTitle:New version available`,
            newVersionMessage: $localize`:@@ngx-pwa.updates.newVersionMessage:A new version of the app has been downloaded. Reload to use it.`,
            unrecoverableTitle: $localize`:@@ngx-pwa.updates.unrecoverableTitle:Reload needed`,
            unrecoverableMessage: $localize`:@@ngx-pwa.updates.unrecoverableMessage:Parts of this version of the app can't be loaded anymore. Reload to use the current version.`,
            reload: $localize`:@@ngx-pwa.updates.reload:Reload`,
            notNow: $localize`:@@ngx-pwa.updates.notNow:Not now`
        }
    };
}

/**
 * How the user is told about a new version of the app. Set it with provideUpdates.
 */
export const UPDATES_CONFIG: InjectionToken<UpdatesConfig> = new InjectionToken<UpdatesConfig>('UPDATES_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultUpdatesConfig()
});

/**
 * Changes how the user is told about a new version of the app. Values you leave out keep their defaults, including
 * single labels.
 * @param config - The values to change.
 * @returns The provider for UPDATES_CONFIG.
 */
export function provideUpdatesConfig(config: UpdatesConfigChanges): Provider {
    // no merging with a parent injector: the UpdateService lives in the root injector and never sees a config further down.
    // A factory rather than a value, so the default texts are resolved once the config is injected, like without it.
    return {
        provide: UPDATES_CONFIG,
        useFactory: (): UpdatesConfig => ({ labels: { ...getDefaultUpdatesConfig().labels, ...config.labels } })
    };
}
import { InjectionToken, Provider } from '@angular/core';

import { UpdatesConfigChanges } from './updates-config-changes.model';
import { UpdatesConfig } from './updates-config.model';

const DEFAULT_UPDATES_CONFIG: UpdatesConfig = {
    labels: {
        newVersionTitle: 'New version available',
        newVersionMessage: 'A new version of the app has been downloaded. Reload to use it.',
        unrecoverableTitle: 'Reload needed',
        unrecoverableMessage: 'Parts of this version of the app can\'t be loaded anymore. Reload to use the current version.',
        reload: 'Reload',
        notNow: 'Not now'
    }
};

/**
 * How the user is told about a new version of the app. Set it with provideUpdates.
 */
export const UPDATES_CONFIG: InjectionToken<UpdatesConfig> = new InjectionToken<UpdatesConfig>('UPDATES_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_UPDATES_CONFIG
});

/**
 * Changes how the user is told about a new version of the app. Values you leave out keep their defaults, including
 * single labels.
 * @param config - The values to change.
 * @returns The provider for UPDATES_CONFIG.
 */
export function provideUpdatesConfig(config: UpdatesConfigChanges): Provider {
    // no merging with a parent injector: the UpdateService lives in the root injector and never sees a config further down.
    const updatesConfig: UpdatesConfig = { labels: { ...DEFAULT_UPDATES_CONFIG.labels, ...config.labels } };
    return { provide: UPDATES_CONFIG, useValue: updatesConfig };
}
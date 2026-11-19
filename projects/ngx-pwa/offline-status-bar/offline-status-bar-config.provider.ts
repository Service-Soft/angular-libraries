import { inject, InjectionToken, Provider } from '@angular/core';

import { OfflineStatusBarConfigChanges } from './offline-status-bar-config-changes.model';
import { OfflineStatusBarConfig } from './offline-status-bar-config.model';

const DEFAULT_OFFLINE_STATUS_BAR_CONFIG: OfflineStatusBarConfig = {
    labels: {
        offline: 'Offline',
        loadedAt: 'Data from',
        unsavedChanges: 'Unsaved changes',
        sync: 'Sync'
    }
};

/**
 * The values every offline status bar below this injector uses. Change them with provideOfflineStatusBarConfig.
 */
export const OFFLINE_STATUS_BAR_CONFIG: InjectionToken<OfflineStatusBarConfig> = new InjectionToken<OfflineStatusBarConfig>(
    'OFFLINE_STATUS_BAR_CONFIG',
    {
        providedIn: 'root',
        factory: () => DEFAULT_OFFLINE_STATUS_BAR_CONFIG
    }
);

/**
 * Changes what the offline status bar shows, like its texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for OFFLINE_STATUS_BAR_CONFIG.
 */
export function provideOfflineStatusBarConfig(config: OfflineStatusBarConfigChanges): Provider {
    return {
        provide: OFFLINE_STATUS_BAR_CONFIG,
        useFactory: (): OfflineStatusBarConfig => {
            const parent: OfflineStatusBarConfig = inject(OFFLINE_STATUS_BAR_CONFIG, { skipSelf: true, optional: true })
                ?? DEFAULT_OFFLINE_STATUS_BAR_CONFIG;
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
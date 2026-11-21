import { inject, InjectionToken, Provider } from '@angular/core';

import { OfflineStatusBarConfigChanges } from './offline-status-bar-config-changes.model';
import { OfflineStatusBarConfig } from './offline-status-bar-config.model';

/**
 * What the offline status bar shows when nothing changes it. Its texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultOfflineStatusBarConfig(): OfflineStatusBarConfig {
    return {
        labels: {
            offline: $localize`:@@ngx-pwa.offline-status-bar.offline:Offline`,
            loadedAt: $localize`:@@ngx-pwa.offline-status-bar.loadedAt:Data from`,
            unsavedChanges: $localize`:@@ngx-pwa.offline-status-bar.unsavedChanges:Unsaved changes`,
            sync: $localize`:@@ngx-pwa.offline-status-bar.sync:Sync`
        }
    };
}

/**
 * The values every offline status bar below this injector uses. Change them with provideOfflineStatusBarConfig.
 */
export const OFFLINE_STATUS_BAR_CONFIG: InjectionToken<OfflineStatusBarConfig> = new InjectionToken<OfflineStatusBarConfig>(
    'OFFLINE_STATUS_BAR_CONFIG',
    {
        providedIn: 'root',
        factory: () => getDefaultOfflineStatusBarConfig()
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
                ?? getDefaultOfflineStatusBarConfig();
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
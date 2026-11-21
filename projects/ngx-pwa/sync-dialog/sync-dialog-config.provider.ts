import { InjectionToken, Provider } from '@angular/core';

import { SyncDialogConfigChanges } from './sync-dialog-config-changes.model';
import { SyncDialogConfig } from './sync-dialog-config.model';

/**
 * What the sync dialog shows when nothing changes it. Its texts are $localize, which an app translates like its own,
 * and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultSyncDialogConfig(): SyncDialogConfig {
    return {
        labels: {
            title: $localize`:@@ngx-pwa.sync-dialog.title:Unsaved changes`,
            offline: $localize`:@@ngx-pwa.sync-dialog.offline:You are offline. Your changes are kept on this device until you sync them.`,
            methods: {
                POST: $localize`:@@ngx-pwa.sync-dialog.methods.POST:New`,
                PATCH: $localize`:@@ngx-pwa.sync-dialog.methods.PATCH:Changed`,
                DELETE: $localize`:@@ngx-pwa.sync-dialog.methods.DELETE:Deleted`
            },
            sync: $localize`:@@ngx-pwa.sync-dialog.sync:Sync`,
            discard: $localize`:@@ngx-pwa.sync-dialog.discard:Discard`,
            syncAll: $localize`:@@ngx-pwa.sync-dialog.syncAll:Sync all`,
            discardAll: $localize`:@@ngx-pwa.sync-dialog.discardAll:Discard all`,
            discardAllTitle: $localize`:@@ngx-pwa.sync-dialog.discardAllTitle:Discard every change?`,
            discardAllMessage: $localize`:@@ngx-pwa.sync-dialog.discardAllMessage:The changes are deleted from this device without being synced. This can't be undone.`,
            cancel: $localize`:@@ngx-pwa.sync-dialog.cancel:Cancel`,
            close: $localize`:@@ngx-pwa.sync-dialog.close:Close`,
            beforeLogout: $localize`:@@ngx-pwa.sync-dialog.beforeLogout:Sync or discard your changes before you log out.`,
            stayLoggedIn: $localize`:@@ngx-pwa.sync-dialog.stayLoggedIn:Stay logged in`,
            synced: $localize`:@@ngx-pwa.sync-dialog.synced:Synced.`,
            discarded: $localize`:@@ngx-pwa.sync-dialog.discarded:Discarded.`,
            syncFailed: $localize`:@@ngx-pwa.sync-dialog.syncFailed:Syncing failed. Please try again later.`,
            allSynced: $localize`:@@ngx-pwa.sync-dialog.allSynced:Every change is synced.`
        }
    };
}

/**
 * What the sync dialog shows. Change it with provideSyncDialogConfig.
 */
export const SYNC_DIALOG_CONFIG: InjectionToken<SyncDialogConfig> = new InjectionToken<SyncDialogConfig>('SYNC_DIALOG_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultSyncDialogConfig()
});

/**
 * Changes what the sync dialog shows, like its texts to translate them. Provide it in the application config: the
 * dialog opens from the root of the app and never sees a config further down. Values you leave out keep their
 * defaults, including single labels.
 * @param config - The values to change.
 * @returns The provider for SYNC_DIALOG_CONFIG.
 */
export function provideSyncDialogConfig(config: SyncDialogConfigChanges): Provider {
    return {
        provide: SYNC_DIALOG_CONFIG,
        // a factory rather than a value, so the default texts are resolved once the config is injected, like without it.
        useFactory: (): SyncDialogConfig => {
            const defaults: SyncDialogConfig = getDefaultSyncDialogConfig();
            return {
                labels: { ...defaults.labels, ...config.labels, methods: { ...defaults.labels.methods, ...config.labels?.methods } }
            };
        }
    };
}
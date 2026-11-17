import { InjectionToken, Provider } from '@angular/core';

import { SyncDialogConfigChanges } from './sync-dialog-config-changes.model';
import { SyncDialogConfig } from './sync-dialog-config.model';

const DEFAULT_SYNC_DIALOG_CONFIG: SyncDialogConfig = {
    labels: {
        title: 'Unsaved changes',
        offline: 'You are offline. Your changes are kept on this device until you sync them.',
        methods: {
            POST: 'New',
            PATCH: 'Changed',
            DELETE: 'Deleted'
        },
        sync: 'Sync',
        discard: 'Discard',
        syncAll: 'Sync all',
        discardAll: 'Discard all',
        discardAllTitle: 'Discard every change?',
        discardAllMessage: 'The changes are deleted from this device without being synced. This can\'t be undone.',
        cancel: 'Cancel',
        close: 'Close',
        synced: 'Synced.',
        discarded: 'Discarded.',
        syncFailed: 'Syncing failed. Please try again later.',
        allSynced: 'Every change is synced.'
    }
};

/**
 * What the sync dialog shows. Change it with provideSyncDialogConfig.
 */
export const SYNC_DIALOG_CONFIG: InjectionToken<SyncDialogConfig> = new InjectionToken<SyncDialogConfig>('SYNC_DIALOG_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_SYNC_DIALOG_CONFIG
});

/**
 * Changes what the sync dialog shows, like its texts to translate them. Provide it in the application config: the
 * dialog opens from the root of the app and never sees a config further down. Values you leave out keep their
 * defaults, including single labels.
 * @param config - The values to change.
 * @returns The provider for SYNC_DIALOG_CONFIG.
 */
export function provideSyncDialogConfig(config: SyncDialogConfigChanges): Provider {
    const defaults: SyncDialogConfig = DEFAULT_SYNC_DIALOG_CONFIG;
    const syncDialogConfig: SyncDialogConfig = {
        labels: { ...defaults.labels, ...config.labels, methods: { ...defaults.labels.methods, ...config.labels?.methods } }
    };
    return { provide: SYNC_DIALOG_CONFIG, useValue: syncDialogConfig };
}
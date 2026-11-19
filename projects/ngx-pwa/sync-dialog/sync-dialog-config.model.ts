import { CachedRequestMethod } from '@service-soft/ngx-pwa/offline';

/**
 * The texts of the sync dialog.
 */
export type SyncDialogLabels = {
    /**
     * The heading of the dialog.
     */
    title: string,
    /**
     * Says why nothing can be synced while the user is offline.
     */
    offline: string,
    /**
     * What each kind of request did, shown before what it changed, like 'New: Buy milk'.
     */
    methods: Record<CachedRequestMethod, string>,
    /**
     * The name of the button that syncs one change.
     */
    sync: string,
    /**
     * The name of the button that discards one change.
     */
    discard: string,
    /**
     * The button that syncs every change.
     */
    syncAll: string,
    /**
     * The button that discards every change.
     */
    discardAll: string,
    /**
     * The question before every change is discarded.
     */
    discardAllTitle: string,
    /**
     * Explains what discarding every change does.
     */
    discardAllMessage: string,
    /**
     * The button that keeps the changes when asked whether to discard them.
     */
    cancel: string,
    /**
     * The button that closes the dialog.
     */
    close: string,
    /**
     * Says why the dialog asks before the user logs out.
     */
    beforeLogout: string,
    /**
     * The button that closes the dialog before a logout, which keeps the user logged in.
     */
    stayLoggedIn: string,
    /**
     * Announced when one change was synced.
     */
    synced: string,
    /**
     * Announced when one change was discarded.
     */
    discarded: string,
    /**
     * Shown when syncing failed.
     */
    syncFailed: string,
    /**
     * Shown in a snackbar once every change is synced and the dialog closed.
     */
    allSynced: string
};

/**
 * What the sync dialog shows.
 */
export type SyncDialogConfig = {
    /**
     * The texts of the dialog.
     */
    labels: SyncDialogLabels
};
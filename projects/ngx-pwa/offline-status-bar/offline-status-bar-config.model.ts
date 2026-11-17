/**
 * The texts of the offline status bar.
 */
export type OfflineStatusBarLabels = {
    /**
     * Shown while the user is offline.
     */
    offline: string,
    /**
     * Shown while the user is online and has changes that aren't synced.
     */
    unsavedChanges: string,
    /**
     * The button that opens the sync dialog, followed by the number of changes.
     */
    sync: string
};

/**
 * What the offline status bar shows.
 */
export type OfflineStatusBarConfig = {
    /**
     * The texts of the bar.
     */
    labels: OfflineStatusBarLabels
};
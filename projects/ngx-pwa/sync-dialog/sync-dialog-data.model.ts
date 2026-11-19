/**
 * What the sync dialog can be opened with, as the data of the DialogService.
 */
export type SyncDialogData = {
    /**
     * Whether it asks before the user logs out, with a button to stay logged in instead of closing it. It closes with
     * true once no change is left, which syncBeforeLogout logs out on.
     */
    beforeLogout: boolean
};
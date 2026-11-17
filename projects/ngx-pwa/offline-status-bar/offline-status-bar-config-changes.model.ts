import { OfflineStatusBarLabels } from './offline-status-bar-config.model';

/**
 * The values to change in the config of the offline status bar. Everything is optional, including every single label.
 */
export type OfflineStatusBarConfigChanges = {
    /**
     * The labels to change.
     */
    labels?: Partial<OfflineStatusBarLabels>
};
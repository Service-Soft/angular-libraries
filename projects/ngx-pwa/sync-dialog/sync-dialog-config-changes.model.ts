import { SyncDialogLabels } from './sync-dialog-config.model';

/**
 * The values to change in the config of the sync dialog. Everything is optional, including every single label.
 */
export type SyncDialogConfigChanges = {
    /**
     * The labels to change.
     */
    labels?: Partial<Omit<SyncDialogLabels, 'methods'>> & {
        /**
         * The names of the kinds of requests to change.
         */
        methods?: Partial<SyncDialogLabels['methods']>
    }
};
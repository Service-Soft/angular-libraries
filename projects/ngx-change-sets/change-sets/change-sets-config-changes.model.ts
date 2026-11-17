import { ConfirmDialogData } from '@service-soft/ui/dialog';

import { ChangeSetsConfig, ChangeSetsLabels } from './change-sets-config.model';

/**
 * The values to change in the config of the change sets. Everything is optional, including every single label and
 * every text of the confirm dialogs.
 */
export type ChangeSetsConfigChanges = Partial<Omit<ChangeSetsConfig, 'labels' | 'resetConfirmDialogData' | 'rollbackConfirmDialogData'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<Omit<ChangeSetsLabels, 'types'>> & {
        /**
         * The names of the types to change.
         */
        types?: Partial<ChangeSetsLabels['types']>
    },
    /**
     * The texts of the dialog before undoing a single change set to change.
     */
    resetConfirmDialogData?: Partial<ConfirmDialogData>,
    /**
     * The texts of the dialog before undoing every change set after one to change.
     */
    rollbackConfirmDialogData?: Partial<ConfirmDialogData>
};
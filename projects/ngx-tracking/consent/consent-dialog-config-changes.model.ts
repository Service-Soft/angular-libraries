import { ConsentDialogConfig, ConsentDialogLabels } from './consent-dialog-config.model';

/**
 * The values to change in the config of the consent dialog. Everything is optional, including every single label.
 */
export type ConsentDialogConfigChanges = Partial<Omit<ConsentDialogConfig, 'labels'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<Omit<ConsentDialogLabels, 'categories'>> & {
        /**
         * The names of the categories to change.
         */
        categories?: Partial<ConsentDialogLabels['categories']>
    }
};
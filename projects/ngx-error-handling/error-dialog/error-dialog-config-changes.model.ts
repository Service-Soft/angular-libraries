import { ErrorDialogConfig, ErrorDialogLabels } from './error-dialog-config.model';

/**
 * The values to change in the config of the error dialog. Everything is optional, including every single label.
 */
export type ErrorDialogConfigChanges = Partial<Omit<ErrorDialogConfig, 'labels'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<ErrorDialogLabels>
};
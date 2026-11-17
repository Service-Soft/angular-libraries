import { ConfirmPasswordResetConfig, ConfirmPasswordResetLabels } from './confirm-password-reset-config.model';

/**
 * The values to change in the config of the page that sets a new password with the link of a password reset.
 * Everything is optional, including every single label.
 */
export type ConfirmPasswordResetConfigChanges = Partial<Omit<ConfirmPasswordResetConfig, 'labels'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<ConfirmPasswordResetLabels>
};
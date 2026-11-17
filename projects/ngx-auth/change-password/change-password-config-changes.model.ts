import { ChangePasswordConfig, ChangePasswordLabels } from './change-password-config.model';

/**
 * The values to change in the config of the form that changes the password. Everything is optional, including every
 * single label.
 */
export type ChangePasswordConfigChanges = Partial<Omit<ChangePasswordConfig, 'labels'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<ChangePasswordLabels>
};
import { RequestPasswordResetLabels } from './request-password-reset-config.model';

/**
 * The values to change in the config of the page that sends a link to reset the password. Everything is optional,
 * including every single label.
 */
export type RequestPasswordResetConfigChanges = {
    /**
     * The labels to change.
     */
    labels?: Partial<RequestPasswordResetLabels>
};
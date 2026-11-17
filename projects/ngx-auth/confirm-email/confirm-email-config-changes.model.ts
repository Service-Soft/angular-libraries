import { ConfirmEmailLabels } from './confirm-email-config.model';

/**
 * The values to change in the config of the page the link of an email opens. Everything is optional, including every
 * single label.
 */
export type ConfirmEmailConfigChanges = {
    /**
     * The labels to change.
     */
    labels?: Partial<ConfirmEmailLabels>
};
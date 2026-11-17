import { EmailSettingsLabels } from './email-settings-config.model';

/**
 * The values to change in the config of the email of the logged in user. Everything is optional, including every single
 * label.
 */
export type EmailSettingsConfigChanges = {
    /**
     * The labels to change.
     */
    labels?: Partial<EmailSettingsLabels>
};
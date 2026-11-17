import { ProviderErrorLabels } from './provider-error-config.model';

/**
 * The values to change in the config of the page a failed login at a provider lands on. Everything is optional,
 * including every single label and error.
 */
export type ProviderErrorConfigChanges = {
    /**
     * The labels to change.
     */
    labels?: Partial<Omit<ProviderErrorLabels, 'errors'>> & {
        /**
         * The texts of the errors to change or add.
         */
        errors?: Partial<Record<string, string>>
    }
};
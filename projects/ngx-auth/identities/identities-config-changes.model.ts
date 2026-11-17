import { IdentitiesConfig, IdentitiesLabels } from './identities-config.model';

/**
 * The values to change in the config of the ways to log in. Everything is optional, including every single label.
 */
export type IdentitiesConfigChanges = Partial<Omit<IdentitiesConfig, 'labels'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<IdentitiesLabels>
};
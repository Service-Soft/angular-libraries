import { SessionsLabels } from './sessions-config.model';

/**
 * The values to change in the config of where the user is logged in. Everything is optional, including every single
 * label.
 */
export type SessionsConfigChanges = {
    /**
     * The labels to change.
     */
    labels?: Partial<SessionsLabels>
};
import { UpdatesLabels } from './updates-config.model';

/**
 * The values to change in the config of the updates. Everything is optional, including every single label.
 */
export type UpdatesConfigChanges = {
    /**
     * The labels to change.
     */
    labels?: Partial<UpdatesLabels>
};
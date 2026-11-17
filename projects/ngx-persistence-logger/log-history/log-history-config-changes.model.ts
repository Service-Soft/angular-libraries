import { LogHistoryConfig, LogHistoryLabels } from './log-history-config.model';

/**
 * The values to change in the config of the log history. Everything is optional, including every single label.
 */
export type LogHistoryConfigChanges = Partial<Omit<LogHistoryConfig, 'labels'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<Omit<LogHistoryLabels, 'levels'>> & {
        /**
         * The names of the levels to change.
         */
        levels?: Partial<LogHistoryLabels['levels']>
    }
};
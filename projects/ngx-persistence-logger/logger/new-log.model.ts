import { Log } from 'zibri-contract';

/**
 * A log as the LoggerService sends it to the backend: a log of zibri without what the backend adds, like the id and the
 * dates.
 */
export type NewLog = Pick<Log, 'level' | 'message' | 'context'> & {
    /**
     * The application the log comes from, like 'Website', which every log of the LoggerService names.
     */
    application: string
};
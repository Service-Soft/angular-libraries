import { LogLevel } from 'zibri-contract';

/**
 * A log as the log history shows it.
 */
export type LogView = {
    /**
     * The id of the log.
     */
    id: string,
    /**
     * When the log was created, in the date format of the config.
     */
    createdAt: string,
    /**
     * When the log was created, as an ISO string for the datetime of the time element.
     */
    createdAtIso: string,
    /**
     * How important the log is.
     */
    level: LogLevel,
    /**
     * What the level is called.
     */
    levelLabel: string,
    /**
     * The classes of the label of the level.
     */
    levelClasses: string,
    /**
     * The application the log comes from, if it has one.
     */
    application?: string,
    /**
     * Where in the application it was logged, like the path of a page or a file.
     */
    origin: string,
    /**
     * The name of the error of the log, if it has one.
     */
    errorName?: string,
    /**
     * What was logged: the message, or the paragraphs of the error, a line each.
     */
    text: string,
    /**
     * What else was logged with it, as indented json.
     */
    metadata?: string,
    /**
     * Where the error happened, a line each.
     */
    stackTrace?: string
};
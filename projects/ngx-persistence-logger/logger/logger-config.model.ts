import { LogLevel } from 'zibri-contract';

/**
 * Where and from which level on the LoggerService logs.
 */
export type LoggerConfig = {
    /**
     * The url the logs are sent to with a POST request.
     */
    logUrl: string,
    /**
     * The name of the application the logs come from, like 'Website'.
     */
    application: string,
    /**
     * The lowest level that is written to the console of the browser.
     */
    minimumConsoleLevel: LogLevel,
    /**
     * The lowest level that is sent to the backend.
     */
    minimumSendLevel: LogLevel
};
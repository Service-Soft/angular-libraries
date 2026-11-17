import { LogLevel } from 'zibri-contract';

/**
 * The texts the log history shows, to translate them.
 */
export type LogHistoryLabels = {
    /**
     * What each level is called, like 'Error'.
     */
    levels: Record<LogLevel, string>,
    /**
     * The group of the buttons that show or hide the logs of a level.
     */
    levelFilter: string,
    /**
     * The filter of the applications.
     */
    applications: string,
    /**
     * What the filter of the applications says while none is selected, which shows the logs of all.
     */
    allApplications: string,
    /**
     * The search.
     */
    search: string,
    /**
     * The button that loads the logs again.
     */
    reload: string,
    /**
     * The button that loads the logs every second while it is pressed.
     */
    liveMode: string,
    /**
     * The section that shows where an error happened.
     */
    stack: string,
    /**
     * What screen readers call the navigation through the pages of the logs.
     */
    pages: string,
    /**
     * What shows when no log matches the filters.
     */
    noLogs: string,
    /**
     * What shows when the logs couldn't be loaded.
     */
    loadingFailed: string
};

/**
 * The values the log history uses.
 */
export type LogHistoryConfig = {
    /**
     * How the date of a log is shown, in the format of Angular's DatePipe.
     */
    dateFormat: string,
    /**
     * How many logs a page has, which is the limit of each request. Zibri allows up to 100 by default.
     */
    pageSize: number,
    /**
     * The levels whose logs show before the user changes the filter. While none is selected, the logs of all show.
     */
    levels: LogLevel[],
    /**
     * How often live mode loads the logs, in milliseconds.
     */
    liveModeInterval: number,
    /**
     * The texts the log history shows.
     */
    labels: LogHistoryLabels
};
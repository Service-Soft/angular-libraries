/**
 * The days an event calendar shows, like the six weeks around a month, which are the events it needs.
 */
export type EventCalendarRange = {
    /**
     * Midnight of the first day, in the time zone of the browser.
     */
    start: Date,
    /**
     * Midnight after the last day, so the events that start before it and end after the start are the ones it shows.
     */
    end: Date
};
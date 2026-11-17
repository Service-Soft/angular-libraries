/**
 * The names of a day of the week, as the head of a column of the month of an event calendar shows them.
 */
export type EventCalendarWeekdayName = {
    /**
     * The short name, like 'Mon', which the calendar shows.
     */
    short: string,
    /**
     * The whole name, like 'Monday', which screen readers read.
     */
    long: string
};
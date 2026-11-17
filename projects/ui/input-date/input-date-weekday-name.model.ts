/**
 * The names of a day of the week, as the head of a column of the calendar of a date input shows them.
 */
export type InputDateWeekdayName = {
    /**
     * The short name, like 'Mon', which the calendar shows.
     */
    short: string,
    /**
     * The whole name, like 'Monday', which screen readers read.
     */
    long: string
};
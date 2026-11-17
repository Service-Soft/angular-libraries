/**
 * How long a date range is, in days or in hours. Days count from the day of the start to the day of the end, whatever
 * the time: from the 12th to the 15th are 3 days. Hours count from the moment of the start to the one of the end.
 */
export type InputDateRangeDuration = {
    /**
     * The number of days.
     */
    days: number
} | {
    /**
     * The number of hours.
     */
    hours: number
};
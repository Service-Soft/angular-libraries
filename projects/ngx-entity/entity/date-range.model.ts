/**
 * A span of time from a start to an end, like a stay or a holiday. On the server it is an object with these two dates,
 * like a zibri class with `@Property.date()` start and end.
 */
export type DateRange = {
    /**
     * The first day, or the moment it starts.
     */
    start: Date,
    /**
     * The last day, or the moment it ends.
     */
    end: Date
};
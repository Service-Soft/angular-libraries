/**
 * The start or end of an event as an event calendar writes it, in a `<time>` element.
 */
export type EventCalendarTime = {
    /**
     * The time in the language of the app, like '9:30 AM', or with the date for another day, like 'Nov 14, 6:00 PM'.
     */
    text: string,
    /**
     * The machine-readable value of the `<time>` element, like '2026-11-12T09:30' or '2026-11-12'.
     */
    dateTime: string
};
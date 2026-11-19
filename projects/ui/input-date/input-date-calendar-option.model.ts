/**
 * A year or a month the calendar of a date input offers to jump to.
 */
export type InputDateCalendarOption = {
    /**
     * Midnight of its first day, in the time zone of the browser.
     */
    date: Date,
    /**
     * The name the calendar shows, like '2026' or 'November'.
     */
    label: string,
    /**
     * Whether it is the one of the month the calendar shows.
     */
    selected: boolean,
    /**
     * Whether all of it is outside of min and max, so it can't be chosen.
     */
    disabled: boolean,
    /**
     * The tailwind classes of the shape that shows it.
     */
    classes: string
};
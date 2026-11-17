/**
 * A day as the calendar of a date input shows it.
 */
export type InputDateCalendarDay = {
    /**
     * Midnight of the day, in the time zone of the browser.
     */
    date: Date,
    /**
     * The number of the day in its month, which the calendar shows.
     */
    dayOfMonth: number,
    /**
     * The whole date in the language of the app, like 'Thursday, 12 November 2026', which screen readers read.
     */
    label: string,
    /**
     * Whether it is the day of the value, or of the end of a range.
     */
    selected: boolean,
    /**
     * Whether it is today.
     */
    today: boolean,
    /**
     * Whether it is outside of min and max, or the validation of the calendar rejects it, so it can't be chosen.
     */
    disabled: boolean,
    /**
     * The tailwind classes of the circle that shows it.
     */
    classes: string
};
import { EventCalendarEntry } from './event-calendar-entry.model';

/**
 * A day as an event calendar shows it, in the month or in the list.
 */
export type EventCalendarDay = {
    /**
     * Midnight of the day, in the time zone of the browser.
     */
    date: Date,
    /**
     * The machine-readable value of its `<time>` element, like '2026-11-12'.
     */
    dateTime: string,
    /**
     * The number of the day in its month.
     */
    dayOfMonth: number,
    /**
     * The whole date in the language of the app, like 'Thursday, November 12, 2026'.
     */
    label: string,
    /**
     * What screen readers read for its cell of the month, as its name: the date, how many events it has and their
     * titles.
     */
    cellLabel: string,
    /**
     * Whether it is today.
     */
    today: boolean,
    /**
     * Whether it is the day whose events show below the month.
     */
    selected: boolean,
    /**
     * Its events.
     */
    entries: EventCalendarEntry[],
    /**
     * The events its cell of the month has room for.
     */
    shownEntries: EventCalendarEntry[],
    /**
     * What its cell says about the events it has no room for, like '+2 more'.
     */
    moreLabel: string | undefined,
    /**
     * The tailwind classes of the number of the day.
     */
    numberClasses: string
};
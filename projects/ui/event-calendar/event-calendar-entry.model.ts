import { EventCalendarTime } from './event-calendar-time.model';

/**
 * An event as an event calendar shows it on one of its days.
 */
export type EventCalendarEntry = {
    /**
     * What identifies the event among the events of the day.
     */
    key: string,
    /**
     * What the event is called.
     */
    title: string,
    /**
     * When it starts, or that it lasts all day.
     */
    start: EventCalendarTime,
    /**
     * When it ends, if that is another time than its start.
     */
    end: EventCalendarTime | undefined,
    /**
     * The time a day of the month shows before the title, like '9:30 AM', or undefined for an event that lasts all day
     * or started on a day before.
     */
    shortTime: string | undefined,
    /**
     * Where it takes place.
     */
    location: string | undefined,
    /**
     * More about it.
     */
    description: string | undefined,
    /**
     * The address of a page about it.
     */
    url: string | undefined,
    /**
     * The name of its category.
     */
    category: string | undefined,
    /**
     * The tailwind classes of its title in a day of the month, in its color and as wide as the day.
     */
    entryClasses: string,
    /**
     * The tailwind classes of its category in its details, in its color.
     */
    categoryClasses: string,
    /**
     * The tailwind classes of the bar in its color next to its details.
     */
    barClasses: string,
    /**
     * The tailwind classes of the dot in its color that stands for it in a narrow day of the month.
     */
    dotClasses: string,
    /**
     * The data url of the iCalendar file of the event.
     */
    calendarFileUrl: string,
    /**
     * The name the iCalendar file downloads as.
     */
    calendarFileName: string
};
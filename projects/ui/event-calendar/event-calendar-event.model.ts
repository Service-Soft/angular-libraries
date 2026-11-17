import { EventCalendarCategory } from './event-calendar-category.model';

/**
 * An event an event calendar shows, like a training of a club or the opening hours of a practice on a holiday, in the
 * time zone of the browser.
 */
export type EventCalendarEvent = {
    /**
     * What identifies the event, like its id in your backend. Without one, its title and start do.
     */
    id?: string,
    /**
     * What the event is called.
     */
    title: string,
    /**
     * When it starts. For an event that lasts all day, any moment of its first day.
     */
    start: Date,
    /**
     * When it ends, or for an event that lasts all day, any moment of its last day. Without one, it ends where it
     * starts.
     */
    end?: Date,
    /**
     * Whether it lasts all day, or all of its days, rather than from one time to another.
     */
    allDay?: boolean,
    /**
     * Where it takes place.
     */
    location?: string,
    /**
     * More about it, shown with its line breaks.
     */
    description?: string,
    /**
     * What kind of event it is. Without one, it is drawn in the color of the calendar.
     */
    category?: EventCalendarCategory,
    /**
     * The address of a page about it, like its registration.
     */
    url?: string
};
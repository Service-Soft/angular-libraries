import { InputCalendarColor, InputWeekday } from '@service-soft/ui/input';

import { EventCalendarColor } from './event-calendar-color.type';
import { EventCalendarView } from './event-calendar-view.type';

/**
 * The values an event calendar uses when its inputs are not set, and its texts.
 */
export type EventCalendarConfig = {
    /**
     * How it shows its events at first.
     */
    view: EventCalendarView,
    /**
     * The color of the events without a category.
     */
    color: EventCalendarColor,
    /**
     * The color of the header, with the month and its buttons, like the calendar of a date input.
     */
    headerColor: InputCalendarColor,
    /**
     * The day the weeks start with, like 1 for Monday or 0 for Sunday.
     */
    firstDayOfWeek: InputWeekday,
    /**
     * How many events a day of the month shows before it says how many more it has.
     */
    maxEventsPerDay: number,
    /**
     * The text of the button that shows the current month and today.
     */
    todayLabel: string,
    /**
     * The name of the button that shows the month before.
     */
    previousMonthLabel: string,
    /**
     * The name of the button that shows the month after.
     */
    nextMonthLabel: string,
    /**
     * The name of the buttons that switch between the month and the list.
     */
    viewLabel: string,
    /**
     * The text of the button that shows the month.
     */
    monthViewLabel: string,
    /**
     * The text of the button that shows the list of the days with events.
     */
    agendaViewLabel: string,
    /**
     * The time of an event that lasts all day.
     */
    allDayLabel: string,
    /**
     * Read before the location of an event.
     */
    locationLabel: string,
    /**
     * The text of the link to the page of an event, read together with its title.
     */
    linkLabel: string,
    /**
     * The text of the link that downloads an event as a calendar file, read together with its title.
     */
    addToCalendarLabel: string,
    /**
     * Shown by the list for a month without events.
     */
    noEventsLabel: string,
    /**
     * Shown below the month for a day without events.
     */
    noEventsOnDayLabel: string,
    /**
     * What a day of the month shows for the events it has no room for, like '+2 more'.
     * @param count - How many more events the day has.
     * @returns The text.
     */
    moreEventsLabel: (count: number) => string,
    /**
     * What screen readers read after the date of a day of the month, like '2 events'.
     * @param count - How many events the day has.
     * @returns The text.
     */
    eventCountLabel: (count: number) => string
};
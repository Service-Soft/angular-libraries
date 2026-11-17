import { EventCalendarColor } from './event-calendar-color.type';

/**
 * What kind of event it is, like a training or a match, which the calendar shows by its color and its label.
 */
export type EventCalendarCategory = {
    /**
     * The name of the category, shown next to the event, so the color isn't the only thing that tells them apart.
     */
    label: string,
    /**
     * The color its events are drawn with.
     */
    color: EventCalendarColor
};
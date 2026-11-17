import { inject, InjectionToken, Provider } from '@angular/core';

import { EventCalendarConfig } from './event-calendar-config.model';

const DEFAULT_EVENT_CALENDAR_CONFIG: EventCalendarConfig = {
    view: 'month',
    color: 'primary',
    headerColor: 'primary',
    // Monday, as in ISO 8601 and like the calendar of a date input.
    firstDayOfWeek: 1,
    maxEventsPerDay: 2,
    todayLabel: 'Today',
    previousMonthLabel: 'Previous month',
    nextMonthLabel: 'Next month',
    viewLabel: 'View',
    monthViewLabel: 'Month',
    agendaViewLabel: 'List',
    allDayLabel: 'All day',
    locationLabel: 'Location',
    linkLabel: 'Details',
    addToCalendarLabel: 'Add to calendar',
    noEventsLabel: 'No events this month.',
    noEventsOnDayLabel: 'No events on this day.',
    moreEventsLabel: count => `+${count} more`,
    eventCountLabel: count => count === 1 ? '1 event' : `${count === 0 ? 'no' : count} events`
};

/**
 * The values every event calendar below this injector uses when its inputs are not set, and its texts.
 * Change them with provideEventCalendarConfig.
 */
export const EVENT_CALENDAR_CONFIG: InjectionToken<EventCalendarConfig> = new InjectionToken<EventCalendarConfig>('EVENT_CALENDAR_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_EVENT_CALENDAR_CONFIG
});

/**
 * Changes the values event calendars use when their inputs are not set, like the texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for EVENT_CALENDAR_CONFIG.
 */
export function provideEventCalendarConfig(config: Partial<EventCalendarConfig>): Provider {
    return {
        provide: EVENT_CALENDAR_CONFIG,
        useFactory: (): EventCalendarConfig => ({
            ...inject(EVENT_CALENDAR_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_EVENT_CALENDAR_CONFIG,
            ...config
        })
    };
}
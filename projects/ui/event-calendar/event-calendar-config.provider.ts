import { inject, InjectionToken, Provider } from '@angular/core';

import { EventCalendarConfig } from './event-calendar-config.model';

/**
 * The values of an event calendar when nothing changes them. Its texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultEventCalendarConfig(): EventCalendarConfig {
    return {
        view: 'month',
        color: 'primary',
        headerColor: 'primary',
        // Monday, as in ISO 8601 and like the calendar of a date input.
        firstDayOfWeek: 1,
        maxEventsPerDay: 2,
        todayLabel: $localize`:@@ui.event-calendar.todayLabel:Today`,
        previousMonthLabel: $localize`:@@ui.event-calendar.previousMonthLabel:Previous month`,
        nextMonthLabel: $localize`:@@ui.event-calendar.nextMonthLabel:Next month`,
        viewLabel: $localize`:@@ui.event-calendar.viewLabel:View`,
        monthViewLabel: $localize`:@@ui.event-calendar.monthViewLabel:Month`,
        agendaViewLabel: $localize`:@@ui.event-calendar.agendaViewLabel:List`,
        allDayLabel: $localize`:@@ui.event-calendar.allDayLabel:All day`,
        locationLabel: $localize`:@@ui.event-calendar.locationLabel:Location`,
        linkLabel: $localize`:@@ui.event-calendar.linkLabel:Details`,
        addToCalendarLabel: $localize`:@@ui.event-calendar.addToCalendarLabel:Add to calendar`,
        noEventsLabel: $localize`:@@ui.event-calendar.noEventsLabel:No events this month.`,
        noEventsOnDayLabel: $localize`:@@ui.event-calendar.noEventsOnDayLabel:No events on this day.`,
        moreEventsLabel: count => $localize`:@@ui.event-calendar.moreEventsLabel:+${count}:count: more`,
        eventCountLabel: count => {
            // a text of its own for each form, as $localize has no plurals.
            if (count === 0) {
                return $localize`:@@ui.event-calendar.eventCountLabel.none:no events`;
            }
            return count === 1
                ? $localize`:@@ui.event-calendar.eventCountLabel.one:1 event`
                : $localize`:@@ui.event-calendar.eventCountLabel.other:${count}:count: events`;
        }
    };
}

/**
 * The values every event calendar below this injector uses when its inputs are not set, and its texts.
 * Change them with provideEventCalendarConfig.
 */
export const EVENT_CALENDAR_CONFIG: InjectionToken<EventCalendarConfig> = new InjectionToken<EventCalendarConfig>('EVENT_CALENDAR_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultEventCalendarConfig()
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
            ...inject(EVENT_CALENDAR_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultEventCalendarConfig(),
            ...config
        })
    };
}
import { Component, inject, input, InputSignal } from '@angular/core';

import { EventCalendarConfig } from './event-calendar-config.model';
import { EVENT_CALENDAR_CONFIG } from './event-calendar-config.provider';
import { EventCalendarDay } from './event-calendar-day.model';
import { EventCalendarEventListComponent } from './event-calendar-event-list.component';

/**
 * The list of ui-event-calendar: the days of a month with events, each with the details of its events, or a text that
 * says the month has none.
 */
@Component({
    selector: 'ui-event-calendar-agenda',
    templateUrl: './event-calendar-agenda.component.html',
    imports: [EventCalendarEventListComponent],
    host: {
        class: 'block'
    }
})
export class EventCalendarAgendaComponent {
    /**
     * The days with events.
     */
    readonly days: InputSignal<EventCalendarDay[]> = input.required<EventCalendarDay[]>();

    /**
     * The texts of the list.
     */
    protected readonly labels: EventCalendarConfig = inject(EVENT_CALENDAR_CONFIG);
}
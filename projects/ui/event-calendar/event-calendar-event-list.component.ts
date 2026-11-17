import { Component, input, InputSignal } from '@angular/core';

import { EventCalendarEntry } from './event-calendar-entry.model';
import { EventCalendarEventComponent } from './event-calendar-event.component';

/**
 * The details of the events of a day of ui-event-calendar, below each other, or a text that says there are none.
 */
@Component({
    selector: 'ui-event-calendar-event-list',
    templateUrl: './event-calendar-event-list.component.html',
    imports: [EventCalendarEventComponent],
    host: {
        class: 'block'
    }
})
export class EventCalendarEventListComponent {
    /**
     * The events, as the day shows them.
     */
    readonly entries: InputSignal<EventCalendarEntry[]> = input.required<EventCalendarEntry[]>();

    /**
     * What it says when the day has no events.
     */
    readonly emptyLabel: InputSignal<string> = input.required<string>();
}
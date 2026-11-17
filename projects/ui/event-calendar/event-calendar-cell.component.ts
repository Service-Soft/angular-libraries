import { Component, input, InputSignal } from '@angular/core';

import { EventCalendarDay } from './event-calendar-day.model';

/**
 * What a day of the month of ui-event-calendar shows in its cell: its number, and the titles of its events where the
 * calendar is wide enough for them, or a dot for each of them where it isn't. Screen readers read the date, how many
 * events it has and their titles instead, which name the cell.
 */
@Component({
    selector: 'ui-event-calendar-cell',
    templateUrl: './event-calendar-cell.component.html',
    host: {
        // the number centered like a day of the calendar of a date input, the events as wide as the day
        class: 'flex flex-col gap-1'
    }
})
export class EventCalendarCellComponent {
    /**
     * The day.
     */
    readonly day: InputSignal<EventCalendarDay> = input.required<EventCalendarDay>();
}
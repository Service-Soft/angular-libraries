import { Component, inject, input, InputSignal } from '@angular/core';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { LinkComponent } from '@service-soft/ui/link';

import { EventCalendarConfig } from './event-calendar-config.model';
import { EVENT_CALENDAR_CONFIG } from './event-calendar-config.provider';
import { EventCalendarEntry } from './event-calendar-entry.model';

/**
 * The details of an event of ui-event-calendar on one of its days: a bar in its color, its title, when it takes place,
 * its category, location and description, a link to its page and one that adds it to the calendar of the user.
 */
@Component({
    selector: 'ui-event-calendar-event',
    templateUrl: './event-calendar-event.component.html',
    imports: [IconComponent, LinkComponent],
    host: {
        class: 'flex gap-3'
    }
})
export class EventCalendarEventComponent {
    /**
     * The event, as the day shows it.
     */
    readonly entry: InputSignal<EventCalendarEntry> = input.required<EventCalendarEntry>();

    /**
     * The texts of the links and of the location.
     */
    protected readonly labels: EventCalendarConfig = inject(EVENT_CALENDAR_CONFIG);

    /**
     * The icon before the location.
     */
    protected readonly locationIcon: IconDefinition = faLocationDot;
}
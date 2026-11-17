import { Component, input, InputSignal } from '@angular/core';

/**
 * An entry of `<ui-timeline>`: when it was, its heading and your own text,
 * `<ui-timeline-entry date="Since 2023" datetime="2023" heading="Head coach"><p>…</p></ui-timeline-entry>`.
 */
@Component({
    selector: 'ui-timeline-entry',
    templateUrl: './timeline-entry.component.html',
    host: {
        // a list item of the ordered list of ui-timeline, without being an li, which only the consumer could write.
        role: 'listitem',
        class: 'group grid grid-cols-[auto_1fr] gap-x-4'
    }
})
export class TimelineEntryComponent {
    /**
     * When it was, as it shows, like '2019 – 2023', 'Since March 2021' or 'Summer 1990'.
     */
    readonly date: InputSignal<string> = input.required<string>();

    /**
     * The date as machines read it, for search engines, like '2021-03' or '1990'. With one, the date is a time element.
     * It is a single date or a duration, a period from one date to another has none.
     */
    readonly datetime: InputSignal<string | undefined> = input<string>();

    /**
     * The heading of the entry, like 'Head coach' or 'Founded'.
     */
    readonly heading: InputSignal<string> = input.required<string>();
}
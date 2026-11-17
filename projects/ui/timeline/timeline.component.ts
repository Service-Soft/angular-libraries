import { Component } from '@angular/core';

/**
 * Entries in the order of their dates, below each other on a line, like the history of a club, the stations of a CV or
 * the dates of a course: `<ui-timeline><ui-timeline-entry date="2019 – 2023" heading="Developer at Acme">…
 * </ui-timeline-entry></ui-timeline>`. It is an ordered list, so write the entries in the order they should be read,
 * oldest or newest first.
 */
@Component({
    selector: 'ui-timeline',
    templateUrl: './timeline.component.html',
    host: {
        class: 'block'
    }
})
export class TimelineComponent {}
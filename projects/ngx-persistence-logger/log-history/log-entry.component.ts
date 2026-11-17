import { Component, input, InputSignal } from '@angular/core';
import { DetailsComponent, SummaryComponent } from '@service-soft/ui/details';

import { LogView } from './log-view.model';

/**
 * One log of the log history: its level, application, origin and date, what was logged and its error. Internal to the
 * log history.
 */
@Component({
    selector: 'ngx-log-entry',
    templateUrl: './log-entry.component.html',
    imports: [DetailsComponent, SummaryComponent],
    host: { class: 'block' }
})
export class LogEntryComponent {
    /**
     * The log to show.
     */
    readonly log: InputSignal<LogView> = input.required<LogView>();

    /**
     * The summary of the section with the stack of the error.
     */
    readonly stackLabel: InputSignal<string> = input.required<string>();
}
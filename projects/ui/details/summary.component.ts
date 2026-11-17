import { Component } from '@angular/core';

/**
 * The always visible part of a `<ui-details>`, which opens and closes it. Screen readers announce it as a button, so
 * everything inside it is read as its label and nothing inside it may be interactive. Several parts, like a title and a
 * date, wrap on narrow screens.
 */
@Component({
    selector: 'ui-summary',
    templateUrl: './summary.component.html',
    host: {
        class: 'flex min-w-0 grow flex-wrap items-center gap-x-4 gap-y-1'
    }
})
export class SummaryComponent {}
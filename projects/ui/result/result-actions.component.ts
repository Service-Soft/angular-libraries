import { Component } from '@angular/core';

/**
 * The actions of a ui-result, like a link back to the start page or a button that tries again. Put it inside of the
 * result, and it shows below the text, the actions next to each other, wrapping on a narrow screen.
 */
@Component({
    selector: 'ui-result-actions',
    templateUrl: './result-actions.component.html',
    host: { class: 'flex flex-wrap justify-center gap-3 pt-2' }
})
export class ResultActionsComponent {}
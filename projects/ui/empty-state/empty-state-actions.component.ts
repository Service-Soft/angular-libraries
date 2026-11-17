import { Component } from '@angular/core';

/**
 * The actions of a ui-empty-state below its text, like a button that creates the first item or one that resets the
 * filters: `<ui-empty-state-actions><button ui-button type="button">New order</button></ui-empty-state-actions>`.
 */
@Component({
    selector: 'ui-empty-state-actions',
    templateUrl: './empty-state-actions.component.html',
    host: {
        class: 'flex flex-wrap justify-center gap-2'
    }
})
export class EmptyStateActionsComponent {}
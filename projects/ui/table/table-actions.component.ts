import { Component } from '@angular/core';

/**
 * The actions of a ui-table, like a button that creates a row. Put it inside of the table, and it shows next to the
 * label, at the end.
 */
@Component({
    selector: 'ui-table-actions',
    templateUrl: './table-actions.component.html',
    host: { class: 'flex flex-wrap items-center gap-2' }
})
export class TableActionsComponent {}
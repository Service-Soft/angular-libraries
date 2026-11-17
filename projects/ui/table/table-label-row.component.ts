import { booleanAttribute, Component, input, InputSignal, InputSignalWithTransform } from '@angular/core';

/**
 * The row of the label of ui-table, with its ui-table-actions next to it. Takes no room while it has neither. Internal
 * to the table.
 */
@Component({
    selector: 'ui-table-label-row',
    templateUrl: './table-label-row.component.html',
    host: { class: 'flex flex-wrap items-center justify-end gap-2 px-3 py-2 empty:hidden' }
})
export class TableLabelRowComponent {
    /**
     * The label of the table.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * The id of the label, which names the table.
     */
    readonly labelId: InputSignal<string> = input.required<string>();

    /**
     * Whether the label is left to the caption of the table, which only screen readers read.
     */
    readonly hideLabel: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the label is marked as required.
     */
    readonly required: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
}
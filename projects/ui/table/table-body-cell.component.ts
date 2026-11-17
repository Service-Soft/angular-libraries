import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, computed, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef, Signal } from '@angular/core';

import { TABLE_CELL_CLASSES, TABLE_PHONE_LABEL_CLASSES } from './table-classes';
import { TableColumn } from './table-column.model';

// the first value of a row that opens it is a button, which keyboards reach. It looks like the link it acts as.
const OPEN_BUTTON_CLASSES: string = `
    cursor-pointer rounded-button text-start text-primary underline
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
`;

/**
 * A cell of a row of ui-table: the text of its column, the template of its column, or the button that opens the row.
 * Internal to the table.
 */
@Component({
    // on the td itself, since a row of a table may only hold cells
    selector: 'td[ui-table-body-cell]',
    templateUrl: './table-body-cell.component.html',
    imports: [NgTemplateOutlet],
    host: {
        role: 'cell',
        '[class]': 'classes()'
    }
})
export class TableBodyCellComponent<T> {
    /**
     * The column.
     */
    readonly column: InputSignal<TableColumn<T>> = input.required<TableColumn<T>>();

    /**
     * The row.
     */
    readonly row: InputSignal<T> = input.required<T>();

    /**
     * Whether the cell opens the row: the first cell of a table whose rows open.
     */
    readonly opens: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The id of the value, which describes the checkbox that selects the row.
     */
    readonly valueId: InputSignal<string | undefined> = input<string>();

    /**
     * Emits when the user opens the row.
     */
    readonly opened: OutputEmitterRef<void> = output();

    /**
     * The text of the cell.
     */
    protected readonly text: Signal<string> = computed(() => this.column().value(this.row()));

    /**
     * The tailwind classes of the cell.
     */
    protected readonly classes: Signal<string> = computed(() => TABLE_CELL_CLASSES[this.column().align ?? 'start']);

    /**
     * The tailwind classes of the label of the column on a phone.
     */
    protected readonly phoneLabelClasses: string = TABLE_PHONE_LABEL_CLASSES;

    /**
     * The tailwind classes of the button that opens the row.
     */
    protected readonly openClasses: string = OPEN_BUTTON_CLASSES;
}
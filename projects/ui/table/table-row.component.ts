import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, computed, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef, Signal, TemplateRef } from '@angular/core';

import { TableBodyCellComponent } from './table-body-cell.component';
import { TABLE_CHECKBOX_CLASSES } from './table-classes';
import { TableColumn } from './table-column.model';
import { TableRowContext } from './table-row-context.model';

// a row that opens is a target as a whole for a pointer. On a phone every row is a card of its values.
// A striped table sets every second row apart, and hovering a row that opens still shows over its stripe.
const ROW_CLASSES: Record<'opens' | 'fixed', Record<'striped' | 'plain', string>> = {
    opens: {
        striped: `
            cursor-pointer border-b border-outline-variant
            even:bg-primary-faint
            hover:bg-surface-container
            max-sm:block max-sm:rounded-input max-sm:border max-sm:p-3
        `,
        plain: `
            cursor-pointer border-b border-outline-variant
            hover:bg-surface-container
            max-sm:block max-sm:rounded-input max-sm:border max-sm:p-3
        `
    },
    fixed: {
        striped: 'border-b border-outline-variant even:bg-primary-faint max-sm:block max-sm:rounded-input max-sm:border max-sm:p-3',
        plain: 'border-b border-outline-variant max-sm:block max-sm:rounded-input max-sm:border max-sm:p-3'
    }
};

// the elements a click on which does what they do, rather than opening the row.
const INTERACTIVE_SELECTOR: string = 'a, button, input, label, select, textarea, [role="button"], [role="menuitem"]';

/**
 * A row of ui-table: its checkbox, its cells and its actions. Internal to the table.
 */
@Component({
    // on the tr itself, since the body of a table may only hold rows
    selector: 'tr[ui-table-row]',
    templateUrl: './table-row.component.html',
    imports: [NgTemplateOutlet, TableBodyCellComponent],
    host: {
        role: 'row',
        '[class]': 'classes()',
        '(click)': 'openFromRow($event)'
    }
})
export class TableRowComponent<T> {
    /**
     * The row.
     */
    readonly row: InputSignal<T> = input.required<T>();

    /**
     * The columns of the table.
     */
    readonly columns: InputSignal<TableColumn<T>[]> = input.required<TableColumn<T>[]>();

    /**
     * Whether the row has a checkbox that selects it.
     */
    readonly selectable: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the row is selected.
     */
    readonly selected: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the row opens, by its first value or a click anywhere else on it.
     */
    readonly opens: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the table stripes its rows, which sets every second one apart.
     */
    readonly striped: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The template of the actions of the row.
     */
    readonly actions: InputSignal<TemplateRef<TableRowContext<T>> | undefined> = input<TemplateRef<TableRowContext<T>>>();

    /**
     * The id of the first value of the row, which describes its checkbox.
     */
    readonly valueId: InputSignal<string> = input.required<string>();

    /**
     * The name of the checkbox that selects the row.
     */
    readonly selectLabel: InputSignal<string> = input.required<string>();

    /**
     * Emits when the user selects or deselects the row.
     */
    readonly toggled: OutputEmitterRef<void> = output();

    /**
     * Emits when the user opens the row.
     */
    readonly opened: OutputEmitterRef<void> = output();

    /**
     * The tailwind classes of the row.
     */
    protected readonly classes: Signal<string> = computed(
        () => ROW_CLASSES[this.opens() ? 'opens' : 'fixed'][this.striped() ? 'striped' : 'plain']
    );

    /**
     * The tailwind classes of the checkbox.
     */
    protected readonly checkboxClasses: string = TABLE_CHECKBOX_CLASSES;

    /**
     * Opens the row when a pointer clicked it outside of what it holds that does something itself.
     * @param event - The click.
     */
    // keyboards open it with the button of its first value, which this leaves to that button.
    protected openFromRow(event: MouseEvent): void {
        const target: EventTarget | null = event.target;
        if (this.opens() && target instanceof Element && target.closest(INTERACTIVE_SELECTOR) == undefined) {
            this.opened.emit();
        }
    }
}
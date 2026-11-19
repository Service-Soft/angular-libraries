import { Grid, GridCell, GridRow } from '@angular/aria/grid';
import { booleanAttribute, Component, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef, Signal, viewChildren } from '@angular/core';

import { INPUT_DATE_CALENDAR_CELL_CLASSES } from './input-date-calendar-classes';
import { InputDateCalendarOption } from './input-date-calendar-option.model';

/**
 * The years or the months the calendar of a date input offers to jump to, in a grid. The arrow keys move through them,
 * and Enter, Space or a click chooses one.
 */
@Component({
    selector: 'ui-input-date-calendar-options',
    templateUrl: './input-date-calendar-options.component.html',
    imports: [Grid, GridRow, GridCell],
    host: {
        class: 'contents'
    }
})
export class InputDateCalendarOptionsComponent {
    /**
     * The years or months, in rows.
     */
    readonly options: InputSignal<InputDateCalendarOption[][]> = input.required<InputDateCalendarOption[][]>();

    /**
     * The name of the grid, which screen readers read.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * Whether the grid is at least as high as the days of a month, so the calendar keeps its height. Not for options
     * that scroll.
     */
    readonly fullHeight: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Emits the year or month the user chose.
     */
    readonly chosen: OutputEmitterRef<InputDateCalendarOption> = output<InputDateCalendarOption>();

    /**
     * The tailwind classes of a cell of the grid.
     */
    protected readonly cellClasses: string = INPUT_DATE_CALENDAR_CELL_CLASSES;

    private readonly cells: Signal<readonly GridCell[]> = viewChildren(GridCell);

    /**
     * Moves focus to the year or month of the month the calendar shows.
     */
    // focusing a cell makes it the active one of the grid, and scrolls to it.
    focusInitialCell(): void {
        const index: number = this.options()
            .flat()
            .findIndex(option => option.selected);
        this.cells()[index]?.element.focus();
    }

    /**
     * Chooses a year or month, when the grid selected or deselected it because the user chose it.
     * @param option - The year or month.
     * @param active - Whether its cell is the active one of the grid.
     */
    // choosing another one first deselects the chosen one, whose cell isn't the active one.
    protected choose(option: InputDateCalendarOption, active: boolean): void {
        if (active) {
            this.chosen.emit(option);
        }
    }
}
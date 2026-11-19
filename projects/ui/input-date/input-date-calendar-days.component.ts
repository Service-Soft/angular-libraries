import { Grid, GridCell, GridRow } from '@angular/aria/grid';
import { afterNextRender, Component, inject, Injector, input, InputSignal, output, OutputEmitterRef, Signal, viewChildren } from '@angular/core';

import { INPUT_DATE_CALENDAR_CELL_CLASSES } from './input-date-calendar-classes';
import { InputDateCalendarDay } from './input-date-calendar-day.model';
import { InputDateWeekdayName } from './input-date-weekday-name.model';

/**
 * The days of a month of the calendar of a date input, in a grid of its weeks below the names of the days of the week.
 * The arrow keys move through them, and Enter, Space or a click chooses one.
 */
@Component({
    selector: 'ui-input-date-calendar-days',
    templateUrl: './input-date-calendar-days.component.html',
    imports: [Grid, GridRow, GridCell],
    host: {
        class: 'contents'
    }
})
export class InputDateCalendarDaysComponent {
    private readonly injector: Injector = inject(Injector);

    /**
     * The weeks of the month, with the days of the months before and after it that fill them.
     */
    readonly weeks: InputSignal<InputDateCalendarDay[][]> = input.required<InputDateCalendarDay[][]>();

    /**
     * The names of the days of the week, in the order of the columns.
     */
    readonly weekdays: InputSignal<InputDateWeekdayName[]> = input.required<InputDateWeekdayName[]>();

    /**
     * The first day of the month the weeks are of.
     */
    readonly month: InputSignal<Date> = input.required<Date>();

    /**
     * The id of the element that names the grid, like the name of the month.
     */
    readonly labelledBy: InputSignal<string> = input.required<string>();

    /**
     * Emits the day the user chose, at midnight in the time zone of the browser.
     */
    readonly chosen: OutputEmitterRef<Date> = output<Date>();

    /**
     * The tailwind classes of a cell of the grid.
     */
    protected readonly cellClasses: string = INPUT_DATE_CALENDAR_CELL_CLASSES;

    private readonly cells: Signal<readonly GridCell[]> = viewChildren(GridCell);

    // while the cells take what the days say after a choice, see syncSelectionAfterRender.
    private syncingSelection: boolean = false;

    /**
     * Moves focus to the chosen day, or today, or the first day of the month that can be chosen.
     */
    // focusing a cell makes it the active one of the grid.
    focusInitialCell(): void {
        this.cells()[this.findInitialDayIndex()]?.element.focus();
    }

    /**
     * Chooses a day, when the grid selected or deselected it because the user chose it.
     * @param day - The day.
     * @param active - Whether its cell is the active one of the grid.
     */
    // choosing another day first deselects the chosen one, whose cell isn't the active one. Deselecting the chosen day
    // itself means the user chose it again, which takes it as well.
    protected choose(day: InputDateCalendarDay, active: boolean): void {
        if (active && !this.syncingSelection) {
            this.chosen.emit(day.date);
            this.syncSelectionAfterRender();
        }
    }

    // the grid selects the cell that was chosen and deselects every other one, or deselects the chosen cell when it was
    // selected already. That isn't always what the days say once the input took the day, like the start of a range,
    // which stays chosen when the end is chosen: a cell whose binding doesn't change would keep what the grid set.
    // Setting it emits selectedChange like a choice of the user, which choose ignores meanwhile.
    private syncSelectionAfterRender(): void {
        afterNextRender(() => {
            const days: InputDateCalendarDay[] = this.weeks().flat();
            this.syncingSelection = true;
            for (const [index, cell] of this.cells().entries()) {
                cell.selected.set(days[index]?.selected ?? false);
            }
            this.syncingSelection = false;
        }, { injector: this.injector });
    }

    private findInitialDayIndex(): number {
        const days: InputDateCalendarDay[] = this.weeks().flat();
        const month: number = this.month().getMonth();
        return [
            days.findIndex(day => day.selected),
            days.findIndex(day => day.today && day.date.getMonth() === month),
            days.findIndex(day => !day.disabled && day.date.getMonth() === month)
        ].find(found => found >= 0) ?? -1;
    }
}
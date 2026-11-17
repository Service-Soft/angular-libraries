import { Grid, GridCell, GridRow } from '@angular/aria/grid';
import { afterNextRender, Component, computed, inject, Injector, input, InputSignal, linkedSignal, LOCALE_ID, output, OutputEmitterRef, signal, Signal, viewChildren, WritableSignal } from '@angular/core';
import { faChevronDown, faChevronLeft, faChevronRight, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { INPUT_CONFIG, InputCalendarColor, InputConfig, InputValidation } from '@service-soft/ui/input';

import { INPUT_DATE_CALENDAR_DAY_CLASSES, INPUT_DATE_CALENDAR_DAY_STATE_CLASSES, INPUT_DATE_CALENDAR_HEADER_CLASSES, INPUT_DATE_CALENDAR_HEADER_COLOR_CLASSES, INPUT_DATE_CALENDAR_TODAY_CLASSES } from './input-date-calendar-classes';
import { InputDateCalendarDay } from './input-date-calendar-day.model';
import { InputDateCalendarOption } from './input-date-calendar-option.model';
import { InputDateCalendarView } from './input-date-calendar-view.type';
import { InputDateWeekdayName } from './input-date-weekday-name.model';
import { InputDateUtilities } from './input-date.utilities';

// the cell is what the grid focuses, the circle inside of it shows the day: preflight collapses the borders of tables,
// which ignores the radius of a cell. So the cell shows nothing itself, and the circle shows its hover and focus.
const CELL_CLASSES: string = 'group cursor-pointer p-0.5 outline-none aria-disabled:pointer-events-none';

// a year or a month fills its cell, they have no fixed size like the days.
const OPTION_CLASSES: string = `
    flex min-h-9 items-center justify-center rounded-full px-2 text-body transition-colors
    group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary
    group-aria-disabled:opacity-50
`;

// the one of the shown month looks like the chosen day.
const OPTION_STATE_CLASSES: Record<'selected' | 'other', string> = {
    selected: INPUT_DATE_CALENDAR_DAY_STATE_CLASSES.selected,
    other: INPUT_DATE_CALENDAR_DAY_STATE_CLASSES.inMonth
};

// the month and year at the top, as text that hovers like a day rather than a colored text button. A transparent border
// keeps its shape in forced colors mode while hovered.
const HEADER_BUTTON_CLASSES: string = `
    mx-auto inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-button border border-transparent px-2
    text-center text-label-lg text-on-surface transition-colors
    hover:bg-surface-container
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
    [&_svg]:size-[1em]
`;

// how many years before and after today, or the shown year, the calendar offers when min or max doesn't limit them.
const YEARS_AROUND: number = 100;
const YEARS_PER_ROW: number = 4;
const MONTHS_PER_ROW: number = 3;
const MONTHS_PER_YEAR: number = 12;

let nextId: number = 0;

/**
 * The calendar of ui-input-date and ui-input-date-range: a month with buttons to the ones before and after it, and its
 * days in a grid, which the arrow keys move through and Enter, Space or a click chooses from. The month and year at the
 * top switch to a grid of years, then to the months of the chosen year, and from there back to the days. Days outside
 * of min and max, or rejected by the validation, can't be chosen. With an end, it shows the range from the value to
 * the end. It moves focus to the chosen day, or today, when it is created, like a dialog that opens, so render it only
 * while it shows, like in a popover.
 */
@Component({
    selector: 'ui-input-date-calendar',
    templateUrl: './input-date-calendar.component.html',
    imports: [ButtonComponent, IconComponent, Grid, GridRow, GridCell],
    host: {
        class: 'block'
    }
})
export class InputDateCalendarComponent {
    private readonly config: InputConfig = inject(INPUT_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    private readonly injector: Injector = inject(Injector);

    /**
     * The date of the input, whose day shows as chosen.
     */
    readonly value: InputSignal<Date | undefined> = input<Date>();

    /**
     * The last day of a range that starts at the value. Its day shows as chosen as well, and the days between them as
     * part of the range.
     */
    readonly end: InputSignal<Date | undefined> = input<Date>();

    /**
     * The earliest day that can be chosen.
     */
    readonly min: InputSignal<Date | undefined> = input<Date>();

    /**
     * The latest day that can be chosen.
     */
    readonly max: InputSignal<Date | undefined> = input<Date>();

    /**
     * Checks a day, at midnight. The days it returns an error message for can't be chosen.
     */
    readonly validation: InputSignal<InputValidation<Date> | undefined> = input<InputValidation<Date>>();

    /**
     * The color of the header, with the month and its buttons.
     */
    readonly color: InputSignal<InputCalendarColor> = input<InputCalendarColor>(this.config.calendarColor);

    /**
     * Emits the day the user chose, at midnight in the time zone of the browser.
     */
    readonly chosen: OutputEmitterRef<Date> = output<Date>();

    /**
     * The id of the name of the month, which names the grid of the days.
     */
    protected readonly monthId: string = `ui-input-date-calendar-${nextId++}`;

    /**
     * The name of the button that shows the month before.
     */
    protected readonly previousMonthLabel: string = this.config.previousMonthLabel;

    /**
     * The name of the button that shows the month after.
     */
    protected readonly nextMonthLabel: string = this.config.nextMonthLabel;

    /**
     * Read after the month and year at the top, whose button switches to the years, and the name of their grid.
     */
    protected readonly chooseYearLabel: string = this.config.chooseYearLabel;

    /**
     * The tailwind classes of a cell of a grid.
     */
    protected readonly cellClasses: string = CELL_CLASSES;

    /**
     * The tailwind classes of the header, in its color.
     */
    protected readonly headerClasses: Signal<string> = computed(() => {
        return `${INPUT_DATE_CALENDAR_HEADER_CLASSES} ${INPUT_DATE_CALENDAR_HEADER_COLOR_CLASSES[this.color()]}`;
    });

    /**
     * The tailwind classes of the button with the month and year at the top.
     */
    protected readonly headerButtonClasses: string = HEADER_BUTTON_CLASSES;

    /**
     * The icon of the button that shows the month before.
     */
    protected readonly previousMonthIcon: IconDefinition = faChevronLeft;

    /**
     * The icon of the button that shows the month after.
     */
    protected readonly nextMonthIcon: IconDefinition = faChevronRight;

    /**
     * What the calendar shows.
     */
    protected readonly view: WritableSignal<InputDateCalendarView> = signal('days');

    /**
     * The icon of the button with the month and year at the top: down while it would open the years, up while it
     * would close them.
     */
    protected readonly headerIcon: Signal<IconDefinition> = computed(() => this.view() === 'days' ? faChevronDown : faChevronUp);

    private readonly today: Date = new Date();

    private readonly monthFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { month: 'long', year: 'numeric' });

    private readonly monthNameFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { month: 'long' });

    private readonly yearFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { year: 'numeric' });

    private readonly dayFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { dateStyle: 'full' });

    private readonly shortWeekdayFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { weekday: 'short' });

    private readonly longWeekdayFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { weekday: 'long' });

    /**
     * The first day of the month that shows: the one of the value, or the current one.
     */
    protected readonly shownMonth: WritableSignal<Date> = linkedSignal(() => {
        return InputDateUtilities.resolveMonthStart(this.value() ?? this.today);
    });

    /**
     * The name of the month that shows, like 'November 2026'.
     */
    protected readonly monthLabel: Signal<string> = computed(() => this.monthFormat.format(this.shownMonth()));

    /**
     * The year of the month that shows, like '2026', which names the grid of its months.
     */
    protected readonly yearLabel: Signal<string> = computed(() => this.yearFormat.format(this.shownMonth()));

    /**
     * The names of the days of the week, in the order of the columns.
     */
    protected readonly weekdays: InputDateWeekdayName[] = (InputDateUtilities.resolveCalendarWeeks(this.today, this.config.firstDayOfWeek)
        .at(0) ?? [])
        .map(date => ({ short: this.shortWeekdayFormat.format(date), long: this.longWeekdayFormat.format(date) }));

    /**
     * The weeks of the month that shows.
     */
    protected readonly weeks: Signal<InputDateCalendarDay[][]> = computed(() => {
        const month: Date = this.shownMonth();
        return InputDateUtilities.resolveCalendarWeeks(month, this.config.firstDayOfWeek)
            .map(week => week.map(date => this.toDay(date, month)));
    });

    /**
     * The years to jump to, in rows: from the year of min to the one of max, or a hundred years around today and the
     * shown year where they don't limit them.
     */
    protected readonly years: Signal<InputDateCalendarOption[][]> = computed(() => {
        const shown: number = this.shownMonth().getFullYear();
        const current: number = this.today.getFullYear();
        const first: number = this.min()?.getFullYear() ?? Math.min(current, shown) - YEARS_AROUND;
        const last: number = this.max()?.getFullYear() ?? Math.max(current, shown) + YEARS_AROUND;
        const years: InputDateCalendarOption[] = Array.from({ length: last - first + 1 }, (_, index) => {
            const date: Date = new Date(first + index, 0, 1);
            return this.toOption(date, this.yearFormat.format(date), first + index === shown, false);
        });
        return this.toRows(years, YEARS_PER_ROW);
    });

    /**
     * The months of the shown year, in rows.
     */
    protected readonly months: Signal<InputDateCalendarOption[][]> = computed(() => {
        const shown: Date = this.shownMonth();
        const months: InputDateCalendarOption[] = Array.from({ length: MONTHS_PER_YEAR }, (_, month) => {
            const date: Date = new Date(shown.getFullYear(), month, 1);
            return this.toOption(date, this.monthNameFormat.format(date), month === shown.getMonth(), this.isMonthOutsideRange(date));
        });
        return this.toRows(months, MONTHS_PER_ROW);
    });

    /**
     * Whether the month before is all before min.
     */
    protected readonly previousMonthDisabled: Signal<boolean> = computed(() => {
        const min: Date | undefined = this.min();
        return min != undefined && this.shownMonth().getTime() <= InputDateUtilities.resolveMonthStart(min).getTime();
    });

    /**
     * Whether the month after is all after max.
     */
    protected readonly nextMonthDisabled: Signal<boolean> = computed(() => {
        const max: Date | undefined = this.max();
        return max != undefined && this.shownMonth().getTime() >= InputDateUtilities.resolveMonthStart(max).getTime();
    });

    private readonly cells: Signal<readonly GridCell[]> = viewChildren(GridCell);

    // while the cells take what the days say after a choice, see syncSelectionAfterRender.
    private syncingSelection: boolean = false;

    constructor() {
        // the calendar is created when it opens, and focus moves into it like into a dialog: to the chosen day, or today,
        // or the first day of the month. Focusing a cell makes it the active one of the grid.
        this.focusInitialCellAfterRender();
    }

    /**
     * Shows another month.
     * @param offset - How many months to go forward, or back when negative.
     */
    protected showMonth(offset: number): void {
        this.shownMonth.update(month => new Date(month.getFullYear(), month.getMonth() + offset, 1));
    }

    /**
     * Switches from the days to the years, with focus on the shown year, or from the years or months back to the days.
     * The button keeps focus then, it stays where it is.
     */
    protected toggleYears(): void {
        if (this.view() !== 'days') {
            this.view.set('days');
            return;
        }
        this.view.set('years');
        this.focusInitialCellAfterRender();
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

    /**
     * Shows the months of a year, when the grid selected or deselected it because the user chose it. Like choose.
     * @param year - The year.
     * @param active - Whether its cell is the active one of the grid.
     */
    protected chooseYear(year: InputDateCalendarOption, active: boolean): void {
        if (!active) {
            return;
        }
        this.shownMonth.update(month => new Date(year.date.getFullYear(), month.getMonth(), 1));
        this.view.set('months');
        this.focusInitialCellAfterRender();
    }

    /**
     * Shows the days of a month, when the grid selected or deselected it because the user chose it. Like choose.
     * @param month - The month.
     * @param active - Whether its cell is the active one of the grid.
     */
    protected chooseMonth(month: InputDateCalendarOption, active: boolean): void {
        if (!active) {
            return;
        }
        this.shownMonth.set(month.date);
        this.view.set('days');
        this.focusInitialCellAfterRender();
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

    // choosing a year or a month removes the grid that had focus, which would leave it on the body.
    private focusInitialCellAfterRender(): void {
        afterNextRender(() => this.findInitialCell()?.element.focus(), { injector: this.injector });
    }

    private findInitialCell(): GridCell | undefined {
        switch (this.view()) {
            case 'days': {
                return this.cells()[this.findInitialDayIndex()];
            }
            case 'years': {
                return this.cells()[this.years().flat().findIndex(year => year.selected)];
            }
            case 'months': {
                return this.cells()[this.months().flat().findIndex(month => month.selected)];
            }
        }
    }

    private findInitialDayIndex(): number {
        const days: InputDateCalendarDay[] = this.weeks().flat();
        const month: number = this.shownMonth().getMonth();
        return [
            days.findIndex(day => day.selected),
            days.findIndex(day => day.today && day.date.getMonth() === month),
            days.findIndex(day => !day.disabled && day.date.getMonth() === month)
        ].find(found => found >= 0) ?? -1;
    }

    private toDay(date: Date, month: Date): InputDateCalendarDay {
        const selected: boolean = InputDateUtilities.isSameDay(this.value(), date)
            || InputDateUtilities.isSameDay(this.end(), date);
        const today: boolean = InputDateUtilities.isSameDay(this.today, date);
        const state: keyof typeof INPUT_DATE_CALENDAR_DAY_STATE_CLASSES = selected
            ? 'selected'
            : this.resolveOtherDayState(date, month);
        return {
            date,
            dayOfMonth: date.getDate(),
            label: this.dayFormat.format(date),
            selected,
            today,
            disabled: this.isOutsideRange(date) || this.validation()?.(date) != undefined,
            classes: [
                INPUT_DATE_CALENDAR_DAY_CLASSES,
                INPUT_DATE_CALENDAR_DAY_STATE_CLASSES[state],
                today && !selected ? INPUT_DATE_CALENDAR_TODAY_CLASSES : ''
            ].join(' ')
        };
    }

    // between the value and the end, by days: both are moments of their day.
    private resolveOtherDayState(date: Date, month: Date): 'inRange' | 'inMonth' | 'outsideMonth' {
        const start: Date | undefined = this.value();
        const end: Date | undefined = this.end();
        if (start != undefined && end != undefined
            && date > InputDateUtilities.resolveDayStart(start) && date < InputDateUtilities.resolveDayStart(end)) {
            return 'inRange';
        }
        return date.getMonth() === month.getMonth() ? 'inMonth' : 'outsideMonth';
    }

    private toOption(date: Date, label: string, selected: boolean, disabled: boolean): InputDateCalendarOption {
        return { date, label, selected, disabled, classes: [OPTION_CLASSES, OPTION_STATE_CLASSES[selected ? 'selected' : 'other']].join(' ') };
    }

    private toRows(options: InputDateCalendarOption[], perRow: number): InputDateCalendarOption[][] {
        return Array.from({ length: Math.ceil(options.length / perRow) }, (_, row) => options.slice(row * perRow, (row + 1) * perRow));
    }

    // by days: with a time, min and max still allow the rest of their day, the input checks the time itself.
    private isOutsideRange(day: Date): boolean {
        const min: Date | undefined = this.min();
        const max: Date | undefined = this.max();
        return (min != undefined && day.getTime() < new Date(min.getFullYear(), min.getMonth(), min.getDate()).getTime())
            || (max != undefined && day.getTime() > max.getTime());
    }

    // a month is all outside when it starts before the month of min or after the one of max.
    private isMonthOutsideRange(month: Date): boolean {
        const min: Date | undefined = this.min();
        const max: Date | undefined = this.max();
        return (min != undefined && month.getTime() < InputDateUtilities.resolveMonthStart(min).getTime())
            || (max != undefined && month.getTime() > InputDateUtilities.resolveMonthStart(max).getTime());
    }
}

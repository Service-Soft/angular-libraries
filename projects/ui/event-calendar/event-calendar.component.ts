import { Grid, GridCell, GridRow } from '@angular/aria/grid';
import { Component, computed, effect, inject, input, InputSignal, linkedSignal, LOCALE_ID, model, ModelSignal, output, OutputEmitterRef, Signal, untracked, WritableSignal } from '@angular/core';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { InputCalendarColor } from '@service-soft/ui/input';
import { INPUT_DATE_CALENDAR_BORDER_CLASSES, INPUT_DATE_CALENDAR_DAY_CLASSES, INPUT_DATE_CALENDAR_DAY_STATE_CLASSES, INPUT_DATE_CALENDAR_HEADER_CLASSES, INPUT_DATE_CALENDAR_HEADER_COLOR_CLASSES, INPUT_DATE_CALENDAR_TODAY_CLASSES, InputDateUtilities } from '@service-soft/ui/input-date';

import { EventCalendarAgendaComponent } from './event-calendar-agenda.component';
import { EventCalendarCellComponent } from './event-calendar-cell.component';
import { EventCalendarColor } from './event-calendar-color.type';
import { EventCalendarConfig } from './event-calendar-config.model';
import { EVENT_CALENDAR_CONFIG } from './event-calendar-config.provider';
import { EventCalendarDay } from './event-calendar-day.model';
import { EventCalendarEntry } from './event-calendar-entry.model';
import { EventCalendarEventListComponent } from './event-calendar-event-list.component';
import { EventCalendarEvent } from './event-calendar-event.model';
import { EventCalendarRange } from './event-calendar-range.model';
import { EventCalendarTime } from './event-calendar-time.model';
import { EventCalendarView } from './event-calendar-view.type';
import { EventCalendarWeekdayName } from './event-calendar-weekday-name.model';
import { EventCalendarUtilities } from './event-calendar.utilities';

// a box like the popover of the calendar of a date input, whose header strip reaches its edges and whose overflow clips
// the strip to its rounded corners. It is a container, so the month shows titles by its own width rather than the one of
// the screen.
const HOST_CLASSES: string = '@container block overflow-hidden rounded-card bg-surface text-on-surface';

// the header strip of the calendar of a date input, wrapping on a narrow calendar: the month and its arrows take the
// rest of the line of today, the view buttons go below when they don't fit.
const HEADER_CLASSES: string = 'flex-wrap';

// the cell is what the grid focuses, the circle of its number shows its hover and focus, like a day of the calendar of a
// date input. Its height is a least one: a table cell grows with its content, so titles that wrap make the row taller
// instead of being cut off. Narrow, like on a phone, it only holds the number of the day and a dot for each event, which
// the calendar shows below it; from 42rem of the calendar on, it shows their titles as well.
const CELL_CLASSES: string = 'group h-14 cursor-pointer p-0.5 align-top outline-none @2xl:h-28';

// a filled label like a filled button, its on- color is checked on it. Neutral is the surface with a border, which
// stands out from the container. The transparent border keeps the shape in forced colors mode.
const LABEL_COLOR_CLASSES: Record<EventCalendarColor, string> = {
    neutral: 'border-outline-variant bg-surface text-on-surface',
    primary: 'border-transparent bg-primary text-on-primary',
    secondary: 'border-transparent bg-secondary text-on-secondary',
    error: 'border-transparent bg-error text-on-error',
    success: 'border-transparent bg-success text-on-success',
    warning: 'border-transparent bg-warning text-on-warning'
};

// an event in a day of the month spans the width of the day, its title wraps rather than being cut off.
const ENTRY_CLASSES: string = 'block w-full rounded-sm border px-1 text-start text-label-sm wrap-break-word';

// the category of an event in its details is as wide as its name.
const CATEGORY_CLASSES: string = 'w-fit rounded-sm border px-1 text-label-sm wrap-break-word';

// decorative marks in the color, like the bar next to the details of an event or a dot in a narrow cell, which size
// them themselves.
const MARK_CLASSES: Record<EventCalendarColor, string> = {
    neutral: 'shrink-0 rounded-full bg-outline',
    primary: 'shrink-0 rounded-full bg-primary',
    secondary: 'shrink-0 rounded-full bg-secondary',
    error: 'shrink-0 rounded-full bg-error',
    success: 'shrink-0 rounded-full bg-success',
    warning: 'shrink-0 rounded-full bg-warning'
};

// the bar next to the details of an event is as high as they are.
const BAR_CLASSES: string = 'w-1 self-stretch';

// forced colors mode removes the fill of a dot, but draws its border.
const DOT_CLASSES: string = 'size-1.5 border border-transparent';

const CALENDAR_FILE_EXTENSION: string = '.ics';

let nextId: number = 0;

/**
 * A calendar of events, like the trainings and matches of a club or the opening hours of a practice: a month as a grid
 * of its weeks, whose days show the titles of their events, or as a list of its days with events. Buttons show the month
 * before and after it and today, and switch between the month and the list. The arrow keys move through the days of the
 * month, and the events of the day they are on show below it, with their time, category, location, description, a link
 * to their page and one that adds them to the calendar of the user. Narrow, the days of the month show a dot for each of
 * their events instead of their titles.
 * The events are yours: give it the ones of the days it shows, which rangeChange emits whenever they change, like
 * from a backend. Dates and names of months and days are in the language of the app (LOCALE_ID).
 * Unset inputs fall back to the values provided with provideEventCalendarConfig.
 */
@Component({
    selector: 'ui-event-calendar',
    templateUrl: './event-calendar.component.html',
    imports: [
        ButtonComponent,
        IconComponent,
        EventCalendarAgendaComponent,
        EventCalendarCellComponent,
        EventCalendarEventListComponent,
        Grid,
        GridRow,
        GridCell
    ],
    host: {
        '[class]': 'classes()'
    }
})
export class EventCalendarComponent {
    private readonly config: EventCalendarConfig = inject(EVENT_CALENDAR_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The events, of at least the days the calendar shows.
     */
    readonly events: InputSignal<readonly EventCalendarEvent[]> = input<readonly EventCalendarEvent[]>([]);

    /**
     * The month the calendar shows, as any moment of it, by default the current one. Bind it with [(month)] to keep it,
     * like in the url.
     */
    readonly month: ModelSignal<Date> = model(new Date());

    /**
     * How the calendar shows its events. The default comes from provideEventCalendarConfig.
     */
    readonly view: ModelSignal<EventCalendarView> = model<EventCalendarView>(this.config.view);

    /**
     * The color of the events without a category. The default comes from provideEventCalendarConfig.
     */
    readonly color: InputSignal<EventCalendarColor> = input<EventCalendarColor>(this.config.color);

    /**
     * The color of the header, with the month and its buttons, like the one of the calendar of a date input. The default
     * comes from provideEventCalendarConfig.
     */
    readonly headerColor: InputSignal<InputCalendarColor> = input<InputCalendarColor>(this.config.headerColor);

    /**
     * The tailwind classes of the calendar, with the border of its header color.
     */
    protected readonly classes: Signal<string> = computed(() => {
        return `${HOST_CLASSES} ${INPUT_DATE_CALENDAR_BORDER_CLASSES[this.headerColor()]}`;
    });

    /**
     * The tailwind classes of the header, in its color.
     */
    protected readonly headerClasses: Signal<string> = computed(() => {
        return `${INPUT_DATE_CALENDAR_HEADER_CLASSES} ${HEADER_CLASSES} ${INPUT_DATE_CALENDAR_HEADER_COLOR_CLASSES[this.headerColor()]}`;
    });

    /**
     * Emits the days the calendar shows, from midnight of the first to midnight after the last, once it starts and
     * whenever they change, so you can load their events.
     */
    readonly rangeChange: OutputEmitterRef<EventCalendarRange> = output<EventCalendarRange>();

    /**
     * The texts of the calendar.
     */
    protected readonly labels: EventCalendarConfig = this.config;

    /**
     * The id of the name of the month, which names the grid of its days.
     */
    protected readonly monthId: string = `ui-event-calendar-${nextId++}`;

    /**
     * The tailwind classes of a day of the month.
     */
    protected readonly cellClasses: string = CELL_CLASSES;

    /**
     * The icon of the button that shows the month before.
     */
    protected readonly previousMonthIcon: IconDefinition = faChevronLeft;

    /**
     * The icon of the button that shows the month after.
     */
    protected readonly nextMonthIcon: IconDefinition = faChevronRight;

    // the moment the calendar was created, as today. A page that stays open over midnight keeps the day it opened on.
    private readonly today: Date = new Date();

    private readonly monthFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { month: 'long', year: 'numeric' });

    private readonly dayFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { dateStyle: 'full' });

    private readonly shortDayFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { dateStyle: 'medium' });

    private readonly timeFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { timeStyle: 'short' });

    private readonly dateTimeFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    private readonly shortWeekdayFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { weekday: 'short' });

    private readonly longWeekdayFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(this.locale, { weekday: 'long' });

    /**
     * The first day of the month that shows.
     */
    // compared by its time, so setting another moment of the same month, like the today button does, changes nothing.
    protected readonly shownMonth: Signal<Date> = computed(() => InputDateUtilities.resolveMonthStart(this.month()), {
        equal: (a, b) => a.getTime() === b.getTime()
    });

    /**
     * The name of the month that shows, like 'November 2026'.
     */
    protected readonly monthLabel: Signal<string> = computed(() => this.monthFormat.format(this.shownMonth()));

    /**
     * The day whose events show below the month: today in the current month, the first day in every other one.
     */
    protected readonly selectedDay: WritableSignal<Date> = linkedSignal(() => {
        const month: Date = this.shownMonth();
        return InputDateUtilities.isSameDay(InputDateUtilities.resolveMonthStart(this.today), month)
            ? InputDateUtilities.resolveDayStart(this.today)
            : month;
    });

    /**
     * The names of the days of the week, in the order of the columns.
     */
    protected readonly weekdays: EventCalendarWeekdayName[] = (
        InputDateUtilities.resolveCalendarWeeks(this.today, this.config.firstDayOfWeek).at(0) ?? []
    ).map(date => ({ short: this.shortWeekdayFormat.format(date), long: this.longWeekdayFormat.format(date) }));

    /**
     * The weeks of the month that shows.
     */
    protected readonly weeks: Signal<EventCalendarDay[][]> = computed(() => {
        const month: Date = this.shownMonth();
        return InputDateUtilities.resolveCalendarWeeks(month, this.config.firstDayOfWeek)
            .map(week => week.map(date => this.toDay(date, month)));
    });

    /**
     * The day whose events show below the month.
     */
    protected readonly shownDay: Signal<EventCalendarDay> = computed(() => this.toDay(this.selectedDay(), this.shownMonth()));

    /**
     * The days of the month that have events, for the list.
     */
    protected readonly agendaDays: Signal<EventCalendarDay[]> = computed(() => {
        const month: Date = this.shownMonth();
        const days: number = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        return Array.from({ length: days }, (_, index) => InputDateUtilities.resolveDayStart(month, index))
            .map(date => this.toDay(date, month))
            .filter(day => day.entries.length > 0);
    });

    /**
     * The days the calendar shows.
     */
    private readonly range: Signal<EventCalendarRange> = computed(
        () => EventCalendarUtilities.resolveRange(this.shownMonth(), this.view(), this.config.firstDayOfWeek),
        { equal: (a, b) => a.start.getTime() === b.start.getTime() && a.end.getTime() === b.end.getTime() }
    );

    constructor() {
        effect(() => {
            const range: EventCalendarRange = this.range();
            untracked(() => this.rangeChange.emit(range));
        });
    }

    /**
     * Shows another month.
     * @param offset - How many months to go forward, or back when negative.
     */
    protected showMonth(offset: number): void {
        const month: Date = this.shownMonth();
        this.month.set(new Date(month.getFullYear(), month.getMonth() + offset, 1));
    }

    /**
     * Shows the current month, with the events of today below it.
     */
    protected showToday(): void {
        this.month.set(this.today);
        this.selectedDay.set(InputDateUtilities.resolveDayStart(this.today));
    }

    /**
     * Shows the events of a day below the month, when the grid selected it because the keyboard moved to it or it was
     * clicked.
     * @param day - The day.
     * @param selected - Whether the grid selected it, rather than deselecting it for another one.
     */
    protected select(day: EventCalendarDay, selected: boolean): void {
        if (selected) {
            this.selectedDay.set(day.date);
        }
    }

    private toDay(date: Date, month: Date): EventCalendarDay {
        const events: EventCalendarEvent[] = EventCalendarUtilities.findEventsOfDay(this.events(), date);
        const entries: EventCalendarEntry[] = events.map(event => this.toEntry(event, date));
        const label: string = this.dayFormat.format(date);
        const titles: string = entries.map(entry => entry.title).join(', ');
        const count: string = this.config.eventCountLabel(entries.length);
        const hidden: number = entries.length - this.config.maxEventsPerDay;
        const selected: boolean = InputDateUtilities.isSameDay(this.selectedDay(), date);
        const today: boolean = InputDateUtilities.isSameDay(this.today, date);
        return {
            date,
            dateTime: InputDateUtilities.getNativeValue(date, 'date'),
            dayOfMonth: date.getDate(),
            label,
            cellLabel: titles === '' ? `${label}, ${count}` : `${label}, ${count}: ${titles}`,
            today,
            selected,
            entries,
            // the last one that fits would only make room for the text that says how many more there are
            shownEntries: hidden > 0 ? entries.slice(0, this.config.maxEventsPerDay) : entries,
            moreLabel: hidden > 0 ? this.config.moreEventsLabel(hidden) : undefined,
            // the circle of a day of the calendar of a date input: filled while selected, a ring for today
            numberClasses: [
                INPUT_DATE_CALENDAR_DAY_CLASSES,
                INPUT_DATE_CALENDAR_DAY_STATE_CLASSES[this.resolveNumberState(selected, date, month)],
                today && !selected ? INPUT_DATE_CALENDAR_TODAY_CLASSES : ''
            ].join(' ')
        };
    }

    private resolveNumberState(selected: boolean, date: Date, month: Date): 'selected' | 'inMonth' | 'outsideMonth' {
        if (selected) {
            return 'selected';
        }
        return date.getMonth() === month.getMonth() ? 'inMonth' : 'outsideMonth';
    }

    private toEntry(event: EventCalendarEvent, day: Date): EventCalendarEntry {
        const color: EventCalendarColor = event.category?.color ?? this.color();
        const [start, end] = this.resolveTimes(event, day);
        const startsToday: boolean = InputDateUtilities.isSameDay(event.start, day);
        return {
            key: EventCalendarUtilities.getKey(event),
            title: event.title,
            start,
            end,
            shortTime: event.allDay === true || !startsToday ? undefined : this.timeFormat.format(event.start),
            location: event.location,
            description: event.description,
            url: event.url,
            category: event.category?.label,
            entryClasses: `${ENTRY_CLASSES} ${LABEL_COLOR_CLASSES[color]}`,
            categoryClasses: `${CATEGORY_CLASSES} ${LABEL_COLOR_CLASSES[color]}`,
            barClasses: `${BAR_CLASSES} ${MARK_CLASSES[color]}`,
            dotClasses: `${DOT_CLASSES} ${MARK_CLASSES[color]}`,
            calendarFileUrl: EventCalendarUtilities.resolveCalendarFileUrl(event, this.today),
            calendarFileName: `${this.resolveFileName(event.title)}${CALENDAR_FILE_EXTENSION}`
        };
    }

    // listed under a day, a time of that day needs no date, one of another day does. An event of whole days is all day,
    // or the days it lasts.
    private resolveTimes(event: EventCalendarEvent, day: Date): [EventCalendarTime, EventCalendarTime | undefined] {
        const end: Date = event.end ?? event.start;
        if (event.allDay === true) {
            return InputDateUtilities.isSameDay(event.start, end)
                ? [{ text: this.config.allDayLabel, dateTime: InputDateUtilities.getNativeValue(event.start, 'date') }, undefined]
                : [this.toDayTime(event.start), this.toDayTime(end)];
        }
        return [
            this.toTime(event.start, day),
            end.getTime() === event.start.getTime() ? undefined : this.toTime(end, day)
        ];
    }

    private toDayTime(date: Date): EventCalendarTime {
        return { text: this.shortDayFormat.format(date), dateTime: InputDateUtilities.getNativeValue(date, 'date') };
    }

    private toTime(date: Date, day: Date): EventCalendarTime {
        const format: Intl.DateTimeFormat = InputDateUtilities.isSameDay(date, day) ? this.timeFormat : this.dateTimeFormat;
        return { text: format.format(date), dateTime: InputDateUtilities.getNativeValue(date, 'datetime-local') };
    }

    // letters and digits of any script, so a German title keeps its umlauts.
    private resolveFileName(title: string): string {
        const name: string = title.toLowerCase()
            .replaceAll(/[^\p{L}\p{N}]+/gu, '-')
            .replaceAll(/^-|-$/g, '');
        return name === '' ? 'event' : name;
    }
}
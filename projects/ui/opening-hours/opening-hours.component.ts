import { afterNextRender, booleanAttribute, Component, computed, DestroyRef, inject, input, InputSignal, InputSignalWithTransform, LOCALE_ID, signal, Signal, WritableSignal } from '@angular/core';
import { InputWeekday } from '@service-soft/ui/input';

import { OpeningHoursConfig } from './opening-hours-config.model';
import { OPENING_HOURS_CONFIG } from './opening-hours-config.provider';
import { OpeningHoursDayFormat } from './opening-hours-day-format.type';
import { OpeningHoursDay } from './opening-hours-day.model';
import { OpeningHoursMoment } from './opening-hours-moment.model';
import { OpeningHoursRow } from './opening-hours-row.model';
import { OpeningHoursState } from './opening-hours-state.type';
import { OpeningHoursUtilities } from './opening-hours.utilities';

// the status and the day that is today change while the page is open, at the latest on the next minute.
const MINUTE: number = 60_000;

// today is bold and has a label that says so. No background: inside a colored surface, a tint of the page's primary
// behind it would lose the contrast of the on- color that the text takes there.
const DAY_CLASSES: Record<'today' | 'other', string> = {
    today: 'py-2 pe-4 text-start align-top font-semibold',
    other: 'py-2 pe-4 text-start align-top font-normal'
};

const HOURS_CLASSES: Record<'today' | 'other', string> = {
    today: 'py-2 align-top font-semibold',
    other: 'py-2 align-top'
};

// the transparent border keeps the dot in forced colors mode, which removes backgrounds. Before the status is known in
// the browser, there is none.
const STATUS_CLASSES: Record<OpeningHoursState, string> = {
    open: 'size-2.5 shrink-0 rounded-full border border-transparent bg-success',
    closed: 'size-2.5 shrink-0 rounded-full border border-transparent bg-outline',
    unknown: 'hidden'
};

// the label next to the day that is today. The transparent border keeps its shape in forced colors mode.
const TODAY_CLASSES: string = 'rounded-full border border-transparent bg-primary px-2 text-label-sm text-on-primary';

// a class rather than a block of the template, which keeps the template simple enough to follow. Before the status is
// known, the row is empty anyway.
const STATUS_ROW_CLASSES: Record<'shown' | 'hidden', string> = {
    shown: 'mb-2 flex min-h-6 items-center gap-2 text-label-lg',
    hidden: 'hidden'
};

/**
 * The opening hours of a week, like the ones of a practice: each day with its times, split hours like 08:00 to 12:00
 * and 14:00 to 18:00 as well, closed days, and a note per day. The names of the days and the times are written in the
 * language of the app (LOCALE_ID). Days after each other with the same hours can share a row, like 'Monday – Thursday'.
 * In the browser, it marks today and says whether it is open now, in the time zone of the business. A page rendered on
 * the server leaves both out, so a page built ahead of time never shows a day that has passed. The hours are marked up
 * with schema.org microdata.
 * Unset inputs fall back to the values provided with provideOpeningHoursConfig.
 */
@Component({
    selector: 'ui-opening-hours',
    templateUrl: './opening-hours.component.html',
    host: {
        class: 'block'
    }
})
export class OpeningHoursComponent {
    private readonly config: OpeningHoursConfig = inject(OPENING_HOURS_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The opening hours of the days. Days that are left out are closed.
     */
    readonly week: InputSignal<OpeningHoursDay[]> = input.required<OpeningHoursDay[]>();

    /**
     * The day the week starts with, like 1 for Monday or 0 for Sunday.
     */
    readonly firstDayOfWeek: InputSignal<InputWeekday> = input<InputWeekday>(this.config.firstDayOfWeek);

    /**
     * Whether days after each other with the same hours and note share a row, like 'Monday – Thursday'.
     */
    readonly group: InputSignalWithTransform<boolean, unknown> = input(this.config.group, { transform: booleanAttribute });

    /**
     * Whether it says above the days whether it is open now.
     */
    readonly status: InputSignalWithTransform<boolean, unknown> = input(this.config.status, { transform: booleanAttribute });

    /**
     * Whether the hours are marked up with schema.org microdata. They are properties of the item around them, like the
     * business of a ui-address or an element of your own with itemscope.
     */
    readonly microdata: InputSignalWithTransform<boolean, unknown> = input(this.config.microdata, { transform: booleanAttribute });

    /**
     * The time zone of the business, like 'Europe/Berlin', which today and the status are in. Undefined is the one of
     * the browser.
     */
    readonly timeZone: InputSignal<string | undefined> = input<string | undefined>(this.config.timeZone);

    /**
     * Whether the names of the days are written in full, like 'Monday', or short, like 'Mon'.
     */
    readonly dayFormat: InputSignal<OpeningHoursDayFormat> = input<OpeningHoursDayFormat>(this.config.dayFormat);

    /**
     * The texts.
     */
    protected readonly labels: OpeningHoursConfig = this.config;

    /**
     * The tailwind classes of the cell of the day.
     */
    protected readonly dayClasses: Record<'today' | 'other', string> = DAY_CLASSES;

    /**
     * The tailwind classes of the cell of the hours.
     */
    protected readonly hoursClasses: Record<'today' | 'other', string> = HOURS_CLASSES;

    /**
     * The tailwind classes of the label of today.
     */
    protected readonly todayClasses: string = TODAY_CLASSES;

    /**
     * The tailwind classes of the row of the status, hidden without one.
     */
    protected readonly statusRowClasses: Record<'shown' | 'hidden', string> = STATUS_ROW_CLASSES;

    /**
     * The schema.org type of a range.
     */
    protected readonly specificationType: string = 'https://schema.org/OpeningHoursSpecification';

    /**
     * The rows of the days, in the order of the week.
     */
    protected readonly rows: Signal<OpeningHoursRow[]> = computed(() => OpeningHoursUtilities.resolveRows(
        this.week(),
        this.firstDayOfWeek(),
        this.group(),
        this.locale,
        this.dayFormat()
    ));

    // undefined on the server and while hydrating: a page built ahead of time would show the day it was built on as today.
    private readonly now: WritableSignal<Date | undefined> = signal(undefined);

    private readonly moment: Signal<OpeningHoursMoment | undefined> = computed(() => {
        const now: Date | undefined = this.now();
        return now == undefined ? undefined : OpeningHoursUtilities.resolveMoment(now, this.timeZone());
    });

    /**
     * The index of the row of today, or -1 before it is known in the browser.
     */
    protected readonly todayIndex: Signal<number> = computed(() => {
        const moment: OpeningHoursMoment | undefined = this.moment();
        return moment == undefined ? -1 : this.rows().findIndex(row => row.weekdays.includes(moment.weekday));
    });

    /**
     * Whether it is open now, unknown before it is known in the browser.
     */
    protected readonly state: Signal<OpeningHoursState> = computed(() => {
        const moment: OpeningHoursMoment | undefined = this.moment();
        if (moment == undefined) {
            return 'unknown';
        }
        return OpeningHoursUtilities.isOpen(this.week(), moment) ? 'open' : 'closed';
    });

    /**
     * The tailwind classes of the dot before the status.
     */
    protected readonly statusClasses: Signal<string> = computed(() => STATUS_CLASSES[this.state()]);

    /**
     * The text of the status, empty before it is known.
     */
    protected readonly statusText: Signal<string> = computed(() => {
        const texts: Record<OpeningHoursState, string> = {
            open: this.config.openNowLabel,
            closed: this.config.closedNowLabel,
            unknown: ''
        };
        return texts[this.state()];
    });

    constructor() {
        const destroyRef: DestroyRef = inject(DestroyRef);
        // only in the browser, once the page is hydrated: what the server rendered matches the first render there.
        afterNextRender(() => {
            this.now.set(new Date());
            const interval: ReturnType<typeof setInterval> = setInterval(() => this.now.set(new Date()), MINUTE);
            destroyRef.onDestroy(() => clearInterval(interval));
        });
    }
}
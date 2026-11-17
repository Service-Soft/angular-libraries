import { Component, computed, effect, ElementRef, inject, input, InputSignal, LOCALE_ID, model, ModelSignal, signal, Signal, untracked, viewChild, WritableSignal } from '@angular/core';
import { faCalendarDays, faClock } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { BaseInputDirective, InputCalendarColor, InputFieldComponent, InputValidation, InputValidityError } from '@service-soft/ui/input';
import { INPUT_DATE_CALENDAR_BORDER_CLASSES, INPUT_DATE_CALENDAR_BUTTON_CLASSES, INPUT_DATE_CALENDAR_CLASSES, InputDateCalendarComponent, InputDateUtilities } from '@service-soft/ui/input-date';
import { INPUT_TIME_CONFIG, InputTimePickerComponent, InputTimeUtilities } from '@service-soft/ui/input-time';

import { InputDateRangeDuration } from './input-date-range-duration.model';
import { InputDateRangeSideField } from './input-date-range-side-field.model';
import { InputDateRangeSide } from './input-date-range-side.type';
import { InputDateRangeTimes } from './input-date-range-times.type';
import { InputDateRange } from './input-date-range.model';
import { InputDateRangeUtilities } from './input-date-range.utilities';

// room for the button of the calendar, so the date never runs under it, and of the picker in the input of a time.
const DATE_CLASSES: string = 'pe-11';

const SIDES: readonly InputDateRangeSide[] = ['start', 'end'];

/**
 * An input for a period from a start to an end, like a booking from its pick-up to its return, with its label, hint
 * and validation error. The start and the end each have a text input, where the user types the day in the format of
 * the language of the app (LOCALE_ID) like in ui-input-date, and one calendar, which the buttons in them open, shows
 * the range and chooses its start, then its end. With times, each side has an input of its time like ui-input-time,
 * whose picker offers the times of its day, like the opening hours.
 * Bind its value two-way with [(value)], an InputDateRange in the time zone of the browser. The rules of the range, like
 * min and max, minDuration and maxDuration, dayValidation and times, make the native input of the start invalid, so a
 * form only submits when the range is valid. The calendar doesn't offer the days they rule out. The error shows once the
 * user left the input or tried to submit its form, or when showValidationError is set to true.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-date-range',
    templateUrl: './input-date-range.component.html',
    imports: [IconComponent, InputDateCalendarComponent, InputFieldComponent, InputTimePickerComponent],
    host: {
        class: 'flex flex-col'
    }
})
export class InputDateRangeComponent extends BaseInputDirective<InputDateRange> {
    /**
     * The range of the input. A side is undefined while the input holds no complete date for it.
     */
    readonly value: ModelSignal<InputDateRange> = model<InputDateRange>({ start: undefined, end: undefined });

    /**
     * The earliest allowed start. Any time of its day is allowed.
     */
    readonly min: InputSignal<Date | undefined> = input<Date>();

    /**
     * The latest allowed end. Any time of its day is allowed.
     */
    readonly max: InputSignal<Date | undefined> = input<Date>();

    /**
     * The shortest allowed range, in days or hours.
     */
    readonly minDuration: InputSignal<InputDateRangeDuration | undefined> = input<InputDateRangeDuration>();

    /**
     * The longest allowed range, in days or hours.
     */
    readonly maxDuration: InputSignal<InputDateRangeDuration | undefined> = input<InputDateRangeDuration>();

    /**
     * Checks a day the range starts or ends on, at midnight, like a closed weekday or a day that is booked out. It
     * returns the error message, or undefined for a day that is allowed. The calendar doesn't offer the days it rejects.
     */
    readonly dayValidation: InputSignal<InputValidation<Date> | undefined> = input<InputValidation<Date>>();

    /**
     * The times the range can start and end at, as 'HH:mm'. Each side then has an input of its time, whose picker offers
     * the times of its day. Without them, the range is of days, and both sides are midnight.
     */
    readonly times: InputSignal<InputDateRangeTimes | undefined> = input<InputDateRangeTimes>();

    /**
     * The label of the start, like 'Pick-up'. The default comes from provideInputConfig.
     */
    readonly startLabel: InputSignal<string> = input<string>(this.config.rangeStartLabel);

    /**
     * The label of the end, like 'Return'. The default comes from provideInputConfig.
     */
    readonly endLabel: InputSignal<string> = input<string>(this.config.rangeEndLabel);

    /**
     * The color of the header of the calendar, with the month and its buttons.
     */
    readonly color: InputSignal<InputCalendarColor> = input<InputCalendarColor>(this.config.calendarColor);

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The format the inputs show their day in.
     */
    private readonly format: Intl.DateTimeFormat = InputDateUtilities.resolveFormat(this.locale, 'date');

    /**
     * The format the inputs of the times show their time in.
     */
    private readonly timeFormat: Intl.DateTimeFormat = InputTimeUtilities.resolveFormat(this.locale);

    /**
     * The texts of the inputs of the start and the end, which are only a date once they are complete.
     */
    protected readonly texts: WritableSignal<Record<InputDateRangeSide, string>> = signal({ start: '', end: '' });

    /**
     * The texts of the inputs of the times of the start and the end, which are only a time once they are complete.
     */
    protected readonly timeTexts: WritableSignal<Record<InputDateRangeSide, string>> = signal({ start: '', end: '' });

    /**
     * Whether the pickers of the times of the start and the end are open, which the browser decides.
     */
    protected readonly timePickerOpen: WritableSignal<Record<InputDateRangeSide, boolean>> = signal({ start: false, end: false });

    /**
     * The placeholder of the inputs of the times, an example of a time in their format, like '06:30 PM'.
     */
    protected readonly timePlaceholder: string = InputTimeUtilities.resolveText('18:30', this.timeFormat);

    /**
     * The icon of the buttons that open the pickers of the times.
     */
    protected readonly timePickerIcon: IconDefinition = faClock;

    /**
     * The name of the pickers of the times, read with the label of their side.
     */
    private readonly timePickerLabel: string = inject(INPUT_TIME_CONFIG).timePickerLabel;

    /**
     * Which side the calendar chooses next.
     */
    protected readonly choosing: WritableSignal<InputDateRangeSide> = signal('start');

    /**
     * The placeholder, by default an example of a date in the format of the inputs, like '12/31/2026'.
     */
    protected readonly shownPlaceholder: Signal<string> = computed(() => {
        return this.placeholder() ?? this.format.format(new Date(new Date().getFullYear(), 11, 31));
    });

    // the browser only knows that the text of the start is required, it can't read a date. Everything else is checked by
    // resolveCustomError, which the native input of the start carries for the whole range.
    /**
     * The errors of the native ValidityState a date range can have.
     */
    protected readonly validityErrors: readonly InputValidityError[] = ['valueMissing'];

    /**
     * The name of the calendar.
     */
    protected readonly datePickerLabel: string = this.config.dateRangePickerLabel;

    /**
     * Read after the label of a side for the input of its time.
     */
    protected readonly timeLabel: string = this.config.timeLabel;

    /**
     * The id of the text that names the inputs of the times.
     */
    protected readonly timeLabelId: Signal<string> = computed(() => `${this.inputId()}-time-label`);

    /**
     * The icon of the buttons that open the calendar.
     */
    protected readonly datePickerIcon: IconDefinition = faCalendarDays;

    /**
     * The tailwind classes of the buttons that open the calendar.
     */
    protected readonly calendarButtonClasses: string = INPUT_DATE_CALENDAR_BUTTON_CLASSES;

    /**
     * The tailwind classes of the popover of the calendar.
     */
    protected readonly calendarClasses: Signal<string> = computed(() => {
        return `${INPUT_DATE_CALENDAR_CLASSES} ${INPUT_DATE_CALENDAR_BORDER_CLASSES[this.color()]}`;
    });

    /**
     * The id of the popover of the calendar, which its buttons point to.
     */
    protected readonly calendarId: Signal<string> = computed(() => `${this.inputId()}-calendar`);

    /**
     * Whether the calendar is open, which the browser decides.
     */
    protected readonly calendarOpen: WritableSignal<boolean> = signal(false);

    /**
     * The label of the side the calendar chooses next, which screen readers announce.
     */
    protected readonly choosingLabel: Signal<string> = computed(() => this.choosing() === 'start' ? this.startLabel() : this.endLabel());

    /**
     * The start and the end, as their labels and inputs show them.
     */
    protected readonly sideFields: Signal<InputDateRangeSideField[]> = computed(() => {
        return SIDES.map(side => this.toSideField(side));
    });

    /**
     * Checks a day of the calendar, so it doesn't offer the days that can't be chosen: the ones dayValidation rejects,
     * the ones without times and, while it chooses the end, the ones after the start that make the range too short or
     * too long in days.
     */
    // the days before the start are offered while choosing the end: choosing one starts the range again. So is the start
    // itself, which stays chosen and must not look like a day that can't be: choosing it as the end only counts when
    // the range of one day is long enough, see choose.
    protected readonly calendarValidation: Signal<InputValidation<Date>> = computed(() => {
        const dayValidation: InputValidation<Date> | undefined = this.dayValidation();
        const times: InputDateRangeTimes | undefined = this.times();
        const start: Date | undefined = this.choosing() === 'end' ? this.value().start : undefined;
        const minDuration: InputDateRangeDuration | undefined = this.minDuration();
        const maxDuration: InputDateRangeDuration | undefined = this.maxDuration();
        return day => {
            const dayError: string | undefined = dayValidation?.(day);
            if (dayError != undefined) {
                return dayError;
            }
            if (times != undefined && InputDateRangeUtilities.resolveTimesOfDay(times, day).length === 0) {
                return this.config.errorMessages.timeNotAllowed;
            }
            return start == undefined || day <= InputDateUtilities.resolveDayStart(start)
                ? undefined
                : this.resolveDurationError(start, day, minDuration, maxDuration, 'days');
        };
    });

    private readonly calendar: Signal<ElementRef<HTMLElement>> = viewChild.required<ElementRef<HTMLElement>>('calendar');

    private readonly sides: Signal<ElementRef<HTMLElement>> = viewChild.required<ElementRef<HTMLElement>>('sides');

    constructor() {
        super();
        // like ui-input-date: a text is only replaced when the value is another day than the text holds, so writing back
        // an incomplete date as undefined doesn't delete what the user typed.
        effect(() => {
            const value: InputDateRange = this.value();
            untracked(() => {
                const texts: Record<InputDateRangeSide, string> = this.texts();
                const start: string = this.resolveText(value.start, texts.start);
                const end: string = this.resolveText(value.end, texts.end);
                if (start !== texts.start || end !== texts.end) {
                    this.texts.set({ start, end });
                }
                const timeTexts: Record<InputDateRangeSide, string> = this.timeTexts();
                const startTime: string = this.resolveTimeText(value.start, timeTexts.start);
                const endTime: string = this.resolveTimeText(value.end, timeTexts.end);
                if (startTime !== timeTexts.start || endTime !== timeTexts.end) {
                    this.timeTexts.set({ start: startTime, end: endTime });
                }
            });
        });
    }

    /**
     * Takes what the user typed for a side as its text, and the day in it as the side of the value, at the time the side
     * had, or the first time of the day.
     * @param side - The side.
     * @param text - The text of its input.
     */
    protected updateText(side: InputDateRangeSide, text: string): void {
        this.texts.update(texts => ({ ...texts, [side]: text }));
        const day: Date | undefined = InputDateUtilities.findDateInText(text, this.format);
        this.value.update(value => ({ ...value, [side]: day == undefined ? undefined : this.resolveSideMoment(side, day) }));
    }

    /**
     * Writes the day the user typed for a side in the format of the input, like '01/02/2026' for '1/2/2026'.
     * @param side - The side.
     */
    protected finishTyping(side: InputDateRangeSide): void {
        const date: Date | undefined = this.value()[side];
        if (date != undefined) {
            this.texts.update(texts => ({ ...texts, [side]: this.format.format(date) }));
        }
    }

    /**
     * Shows the validation error from now on, once focus left the whole range rather than only one of its inputs, which
     * would show that the range is incomplete before the user had the chance to fill in its other side.
     * @param event - The focusout event.
     */
    protected leave(event: FocusEvent): void {
        if (!(event.relatedTarget instanceof Node && this.sides().nativeElement.contains(event.relatedTarget))) {
            this.showValidationError.set(true);
        }
    }

    /**
     * Lets the calendar choose a side, when the button of the side opens it. Without a start, it chooses the start
     * first, also from the button of the end.
     * @param side - The side of the button.
     */
    protected startChoosing(side: InputDateRangeSide): void {
        this.choosing.set(this.value().start == undefined ? 'start' : side);
    }

    /**
     * Takes what the user typed for the time of a side as its text, and the time in it on the day of the side.
     * @param side - The side.
     * @param text - The text of the input of its time.
     */
    protected updateTimeText(side: InputDateRangeSide, text: string): void {
        this.timeTexts.update(texts => ({ ...texts, [side]: text }));
        const time: string | undefined = InputTimeUtilities.findTimeInText(text, this.timeFormat);
        const date: Date | undefined = this.value()[side];
        if (date != undefined && time != undefined) {
            this.value.update(value => ({ ...value, [side]: InputDateRangeUtilities.resolveMoment(date, time) }));
        }
    }

    /**
     * Writes the time the user typed for a side in the format of the input, like '9:30 AM' for '9.30'.
     * @param side - The side.
     */
    protected finishTypingTime(side: InputDateRangeSide): void {
        const time: string | undefined = InputTimeUtilities.findTimeInText(this.timeTexts()[side], this.timeFormat);
        if (time != undefined) {
            this.timeTexts.update(texts => ({ ...texts, [side]: InputTimeUtilities.resolveText(time, this.timeFormat) }));
        }
    }

    /**
     * Takes the time the user chose in the picker of a side, closes the picker and focuses the input of the time again.
     * @param side - The side.
     * @param time - The time, as 'HH:mm'.
     * @param picker - The popover of the picker.
     * @param timeInput - The input of the time.
     */
    protected chooseTime(side: InputDateRangeSide, time: string, picker: HTMLElement, timeInput: HTMLInputElement): void {
        this.updateTimeText(side, InputTimeUtilities.resolveText(time, this.timeFormat));
        picker.hidePopover();
        timeInput.focus();
    }

    /**
     * Notes whether the picker of the time of a side is open, which the browser decides.
     * @param side - The side.
     * @param open - Whether it is open.
     */
    protected toggleTimePicker(side: InputDateRangeSide, open: boolean): void {
        this.timePickerOpen.update(pickers => ({ ...pickers, [side]: open }));
    }

    /**
     * Takes the day the user chose in the calendar for the side it chooses: the start, after which it chooses the end,
     * or the end, which closes it. A day before the start starts the range again, like the start itself when a range of
     * one day is too short, and a start after the end removes the end. The browser moves focus back to the button that opened it.
     * @param day - The day, at midnight.
     */
    protected choose(day: Date): void {
        const { start, end } = this.value();
        if (this.choosing() === 'end' && start != undefined && day >= InputDateUtilities.resolveDayStart(start)
            && this.resolveDurationError(start, day, this.minDuration(), this.maxDuration(), 'days') == undefined) {
            this.value.set({ start, end: this.resolveSideMoment('end', day) });
            this.finishChoosing();
            return;
        }
        const keepsEnd: boolean = end != undefined && InputDateUtilities.resolveDayStart(end) >= day;
        this.value.set({ start: this.resolveSideMoment('start', day), end: keepsEnd ? end : undefined });
        if (keepsEnd) {
            this.finishChoosing();
            return;
        }
        this.choosing.set('end');
    }

    /**
     * Resolves whether the texts are dates and the range is complete and in order, then its rules, then the custom
     * validation.
     * @returns The message, or undefined when the range is empty or meets every rule.
     */
    protected override resolveCustomError(): string | undefined {
        const { start, end } = this.value();
        const texts: Record<InputDateRangeSide, string> = this.texts();
        const unreadTime: boolean = this.times() != undefined && SIDES.some(side => {
            const text: string = this.timeTexts()[side];
            return text.trim() !== '' && InputTimeUtilities.findTimeInText(text, this.timeFormat) == undefined;
        });
        if ((texts.start.trim() !== '' && start == undefined) || (texts.end.trim() !== '' && end == undefined) || unreadTime) {
            return this.config.errorMessages.badInput;
        }
        if (start == undefined && end == undefined) {
            return super.resolveCustomError();
        }
        if (start == undefined || end == undefined) {
            return this.config.errorMessages.rangeIncomplete;
        }
        return end < start
            ? this.config.errorMessages.rangeReversed
            : this.resolveBoundsError(start, end)
                ?? this.dayValidation()?.(InputDateUtilities.resolveDayStart(start))
                ?? this.dayValidation()?.(InputDateUtilities.resolveDayStart(end))
                ?? this.resolveTimeError(start, end)
                ?? this.resolveDurationError(start, end, this.minDuration(), this.maxDuration(), 'all')
                ?? super.resolveCustomError();
    }

    /**
     * Resolves the room for the button that opens the calendar.
     * @returns The tailwind classes.
     */
    protected override resolveExtraClasses(): string {
        return DATE_CLASSES;
    }

    private finishChoosing(): void {
        this.choosing.set('start');
        this.showValidationError.set(true);
        this.calendar().nativeElement.hidePopover();
    }

    private toSideField(side: InputDateRangeSide): InputDateRangeSideField {
        const id: string = this.inputId();
        const date: Date | undefined = this.value()[side];
        const times: InputDateRangeTimes | undefined = this.times();
        const label: string = side === 'start' ? this.startLabel() : this.endLabel();
        const labelId: string = `${id}-${side}-label`;
        const name: string | undefined = this.name();
        const timeId: string = `${id}-${side}-time`;
        const timePickerLabel: string = `${this.timePickerLabel}, ${label}`;
        return {
            side,
            label,
            labelId,
            // the start is what the label of the range points to
            inputId: side === 'start' ? id : `${id}-end`,
            labelledBy: `${this.labelId()} ${labelId}`,
            name: name == undefined ? undefined : `${name}-${side}`,
            text: this.texts()[side],
            calendarButtonLabel: `${this.datePickerLabel}, ${label}`,
            timeId,
            timeLabelledBy: `${this.labelId()} ${labelId} ${this.timeLabelId()}`,
            timeText: this.timeTexts()[side],
            timeAnchorName: `--${timeId}`,
            timePickerId: `${timeId}-picker`,
            timePickerLabel,
            timePickerOpen: this.timePickerOpen()[side],
            times: this.resolveOfferedTimes(times, date),
            time: date == undefined ? undefined : InputTimeUtilities.getTime(date)
        };
    }

    // the same times every day are offered before there is a day, the ones of a day only once there is one.
    private resolveOfferedTimes(times: InputDateRangeTimes | undefined, date: Date | undefined): readonly string[] {
        if (times == undefined || typeof times !== 'function') {
            return times ?? [];
        }
        return date == undefined ? [] : times(date);
    }

    private resolveText(date: Date | undefined, text: string): string {
        const typed: Date | undefined = InputDateUtilities.findDateInText(text, this.format);
        if (InputDateUtilities.getNativeValue(date, 'date') === InputDateUtilities.getNativeValue(typed, 'date')) {
            return text;
        }
        return date == undefined ? '' : this.format.format(date);
    }

    // a side without a day keeps the time the user typed, which it takes once it gets a day.
    private resolveTimeText(date: Date | undefined, text: string): string {
        if (date == undefined || this.times() == undefined) {
            return text;
        }
        const time: string = InputTimeUtilities.getTime(date);
        const typed: string | undefined = InputTimeUtilities.findTimeInText(text, this.timeFormat);
        return typed === time ? text : InputTimeUtilities.resolveText(time, this.timeFormat);
    }

    // a new day keeps the time the user typed or the side had, also one the new day doesn't offer, which then shows its
    // error rather than changing the time behind the user's back. Only a side without a time yet takes the first one of
    // its day.
    private resolveSideMoment(side: InputDateRangeSide, day: Date): Date {
        const times: InputDateRangeTimes | undefined = this.times();
        if (times == undefined) {
            return InputDateUtilities.resolveDayStart(day);
        }
        const previous: Date | undefined = this.value()[side];
        const time: string | undefined = InputTimeUtilities.findTimeInText(this.timeTexts()[side], this.timeFormat)
            ?? (previous == undefined ? InputDateRangeUtilities.resolveTimesOfDay(times, day).at(0) : InputTimeUtilities.getTime(previous));
        return InputDateRangeUtilities.resolveMoment(day, time);
    }

    // by the values of a native date input, which sort like their days.
    private resolveBoundsError(start: Date, end: Date): string | undefined {
        const min: string = InputDateUtilities.getNativeValue(this.min(), 'date');
        const max: string = InputDateUtilities.getNativeValue(this.max(), 'date');
        if (min !== '' && InputDateUtilities.getNativeValue(start, 'date') < min) {
            return this.config.errorMessages.rangeUnderflow;
        }
        return max !== '' && InputDateUtilities.getNativeValue(end, 'date') > max ? this.config.errorMessages.rangeOverflow : undefined;
    }

    private resolveTimeError(start: Date, end: Date): string | undefined {
        const times: InputDateRangeTimes | undefined = this.times();
        if (times == undefined) {
            return undefined;
        }
        const allowed: boolean = [start, end].every(date => {
            return InputDateRangeUtilities.resolveTimesOfDay(times, date).includes(InputTimeUtilities.getTime(date));
        });
        return allowed ? undefined : this.config.errorMessages.timeNotAllowed;
    }

    // the calendar only knows days, so it only checks durations in days. The value checks all of them.
    private resolveDurationError(
        start: Date,
        end: Date,
        minDuration: InputDateRangeDuration | undefined,
        maxDuration: InputDateRangeDuration | undefined,
        units: 'days' | 'all'
    ): string | undefined {
        if (this.isChecked(minDuration, units) && InputDateRangeUtilities.resolveDurationDifference(start, end, minDuration) < 0) {
            return this.config.errorMessages.rangeTooShort;
        }
        const tooLong: boolean = this.isChecked(maxDuration, units)
            && InputDateRangeUtilities.resolveDurationDifference(start, end, maxDuration) > 0;
        return tooLong ? this.config.errorMessages.rangeTooLong : undefined;
    }

    private isChecked(duration: InputDateRangeDuration | undefined, units: 'days' | 'all'): duration is InputDateRangeDuration {
        return duration != undefined && (units === 'all' || 'days' in duration);
    }
}
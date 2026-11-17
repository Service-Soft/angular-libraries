import { Component, computed, effect, ElementRef, inject, input, InputSignal, LOCALE_ID, model, ModelSignal, signal, Signal, untracked, viewChild, WritableSignal } from '@angular/core';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { BaseInputDirective, InputCalendarColor, InputFieldComponent, InputValidation, InputValidityError } from '@service-soft/ui/input';

import { INPUT_DATE_CALENDAR_BORDER_CLASSES, INPUT_DATE_CALENDAR_BUTTON_CLASSES, INPUT_DATE_CALENDAR_CLASSES } from './input-date-calendar-classes';
import { InputDateCalendarComponent } from './input-date-calendar.component';
import { InputDateType } from './input-date-type.type';
import { InputDateUtilities } from './input-date.utilities';

// room for the button of the calendar, so the date never runs under it.
const DATE_CLASSES: string = 'pe-11';

/**
 * An input for a date, like a birthday or a deadline, or a date and a time of it, with its label, hint and validation
 * error. The user types the date in the format of the language of the app (LOCALE_ID), like '11/12/2026' in 'en-US'
 * or '12.11.2026' in 'de', or chooses the day in a calendar that the button in the input opens. The calendar doesn't
 * offer the days outside of min and max, nor the ones customValidation rejects.
 * Bind its value two-way with [(value)], a Date in the time zone of the browser, which is undefined while the input
 * holds no complete date. A text that is no date, and a date outside of min and max, make the native input invalid,
 * so a form only submits when it is valid. The error shows once the user left the input or tried to submit its form,
 * or when showValidationError is set to true.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-date',
    templateUrl: './input-date.component.html',
    imports: [IconComponent, InputDateCalendarComponent, InputFieldComponent],
    host: {
        class: 'flex flex-col'
    }
})
export class InputDateComponent extends BaseInputDirective<Date | undefined> {
    /**
     * The date of the input, undefined while it holds no complete date.
     */
    readonly value: ModelSignal<Date | undefined> = model<Date>();

    /**
     * Whether it is a day, or a day and a time of it.
     */
    readonly type: InputSignal<InputDateType> = input<InputDateType>('date');

    /**
     * The earliest allowed date. With the type date, any time of its day is allowed.
     */
    readonly min: InputSignal<Date | undefined> = input<Date>();

    /**
     * The latest allowed date. With the type date, any time of its day is allowed.
     */
    readonly max: InputSignal<Date | undefined> = input<Date>();

    /**
     * The color of the header of the calendar, with the month and its buttons.
     */
    readonly color: InputSignal<InputCalendarColor> = input<InputCalendarColor>(this.config.calendarColor);

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The format the input shows its date in.
     */
    private readonly format: Signal<Intl.DateTimeFormat> = computed(() => InputDateUtilities.resolveFormat(this.locale, this.type()));

    /**
     * The text of the input, which is only a date once it is complete.
     */
    protected readonly text: WritableSignal<string> = signal('');

    /**
     * The placeholder, by default an example of a date in the format of the input, like '12/31/2026'.
     */
    protected readonly shownPlaceholder: Signal<string> = computed(() => {
        return this.placeholder() ?? this.format().format(new Date(new Date().getFullYear(), 11, 31, 18, 30));
    });

    // the browser only knows that a text is required, it can't read a date. Whether the text is one and whether it is
    // within min and max are checked by resolveCustomError, with the messages of the native errors.
    /**
     * The errors of the native ValidityState a date can have.
     */
    protected readonly validityErrors: readonly InputValidityError[] = ['valueMissing'];

    /**
     * The name of the button that opens the calendar, and of the calendar.
     */
    protected readonly datePickerLabel: string = this.config.datePickerLabel;

    /**
     * The icon of the button that opens the calendar.
     */
    protected readonly datePickerIcon: IconDefinition = faCalendarDays;

    /**
     * The tailwind classes of the button that opens the calendar.
     */
    protected readonly calendarButtonClasses: string = INPUT_DATE_CALENDAR_BUTTON_CLASSES;

    /**
     * The tailwind classes of the popover of the calendar.
     */
    protected readonly calendarClasses: Signal<string> = computed(() => {
        return `${INPUT_DATE_CALENDAR_CLASSES} ${INPUT_DATE_CALENDAR_BORDER_CLASSES[this.color()]}`;
    });

    /**
     * The id of the popover of the calendar, which its button points to.
     */
    protected readonly calendarId: Signal<string> = computed(() => `${this.inputId()}-calendar`);

    /**
     * Whether the calendar is open, which the browser decides.
     */
    protected readonly calendarOpen: WritableSignal<boolean> = signal(false);

    /**
     * Checks a day of the calendar with customValidation, as the value choosing it would give, so the calendar
     * doesn't offer the days it rejects.
     */
    protected readonly dayValidation: Signal<InputValidation<Date> | undefined> = computed(() => {
        const validation: InputValidation<Date | undefined> | undefined = this.customValidation();
        return validation == undefined ? undefined : day => validation(this.resolveChosenValue(day));
    });

    private readonly calendar: Signal<ElementRef<HTMLElement>> = viewChild.required<ElementRef<HTMLElement>>('calendar');

    constructor() {
        super();
        // while the user types a date, it often isn't complete yet. That reads as undefined, and writing undefined back
        // would delete what they typed. So a value is only written as text when it is another date than the text holds.
        effect(() => {
            const value: Date | undefined = this.value();
            const type: InputDateType = this.type();
            const format: Intl.DateTimeFormat = this.format();
            untracked(() => {
                const typed: Date | undefined = InputDateUtilities.findDateInText(this.text(), format);
                if (InputDateUtilities.getNativeValue(value, type) !== InputDateUtilities.getNativeValue(typed, type)) {
                    this.text.set(value == undefined ? '' : format.format(value));
                }
            });
        });
    }

    /**
     * Takes what the user typed as the text, and the date in it as the value.
     * @param text - The text of the input.
     */
    protected updateText(text: string): void {
        this.text.set(text);
        this.value.set(InputDateUtilities.findDateInText(text, this.format()));
    }

    /**
     * Writes the date the user typed in the format of the input, like '01/02/2026' for '1/2/2026', and shows the
     * validation error from now on.
     */
    protected finishTyping(): void {
        const value: Date | undefined = this.value();
        if (value != undefined) {
            this.text.set(this.format().format(value));
        }
        this.showValidationError.set(true);
    }

    /**
     * Takes the day the user chose in the calendar as the value, with the time of the value it replaces, and closes the
     * calendar. The browser moves focus back to the button that opened it.
     * @param day - The day, at midnight.
     */
    protected choose(day: Date): void {
        this.value.set(this.resolveChosenValue(day));
        this.showValidationError.set(true);
        this.calendar().nativeElement.hidePopover();
    }

    /**
     * Resolves whether the text is a date within min and max, then the custom validation.
     * @returns The message, or undefined when the text is empty or such a date.
     */
    protected override resolveCustomError(): string | undefined {
        return this.text().trim() !== '' && this.value() == undefined
            ? this.config.errorMessages.badInput
            : this.resolveRangeError() ?? super.resolveCustomError();
    }

    /**
     * Resolves the room for the button that opens the calendar.
     * @returns The tailwind classes.
     */
    protected override resolveExtraClasses(): string {
        return DATE_CLASSES;
    }

    // the day with the time of the value it replaces, with the type datetime-local.
    private resolveChosenValue(day: Date): Date {
        const time: Date | undefined = this.type() === 'datetime-local' ? this.value() : undefined;
        return new Date(day.getFullYear(), day.getMonth(), day.getDate(), time?.getHours() ?? 0, time?.getMinutes() ?? 0);
    }

    // by the values of a native date input, which sort like their dates, with or without the time like the type.
    private resolveRangeError(): string | undefined {
        const type: InputDateType = this.type();
        const value: string = InputDateUtilities.getNativeValue(this.value(), type);
        const min: string = InputDateUtilities.getNativeValue(this.min(), type);
        const max: string = InputDateUtilities.getNativeValue(this.max(), type);
        if (value !== '' && min !== '' && value < min) {
            return this.config.errorMessages.rangeUnderflow;
        }
        return value !== '' && max !== '' && value > max ? this.config.errorMessages.rangeOverflow : undefined;
    }
}
import { Component, computed, effect, ElementRef, inject, input, InputSignal, LOCALE_ID, model, ModelSignal, signal, Signal, untracked, viewChild, WritableSignal } from '@angular/core';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { BaseInputDirective, InputCalendarColor, InputFieldComponent, InputValidityError } from '@service-soft/ui/input';
import { INPUT_DATE_CALENDAR_BORDER_CLASSES, INPUT_DATE_CALENDAR_BUTTON_CLASSES, INPUT_DATE_CALENDAR_CLASSES } from '@service-soft/ui/input-date';

import { InputTimeConfig } from './input-time-config.model';
import { INPUT_TIME_CONFIG } from './input-time-config.provider';
import { InputTimePickerComponent } from './input-time-picker.component';
import { InputTimeUtilities } from './input-time.utilities';

// room for the button of the picker, so the time never runs under it.
const TIME_CLASSES: string = 'pe-11';

const FIRST_TIME: string = '00:00';
const LAST_TIME: string = '23:59';

/**
 * An input for a time of the day, like the start of an appointment, with its label, hint and validation error. The
 * user types the time in the format of the language of the app (LOCALE_ID), like '9:30 AM' in 'en-US' or '9:30' in
 * 'de', or chooses it in a picker that the button in the input opens, in the style of the calendar of ui-input-date.
 * The picker offers the times of times, or every step minutes from min to max.
 * Bind its value two-way with [(value)], a time as 'HH:mm' like the value of a native time input, which is undefined
 * while the input holds no complete time. A text that is no time, a time outside of min and max, and one the picker
 * doesn't offer make the native input invalid, so a form only submits when it is valid. The error shows once the user
 * left the input or tried to submit its form, or when showValidationError is set to true.
 * Unset inputs fall back to the values provided with provideInputConfig and provideInputTimeConfig.
 */
@Component({
    selector: 'ui-input-time',
    templateUrl: './input-time.component.html',
    imports: [IconComponent, InputFieldComponent, InputTimePickerComponent],
    host: {
        class: 'flex flex-col'
    }
})
export class InputTimeComponent extends BaseInputDirective<string | undefined> {
    private readonly timeConfig: InputTimeConfig = inject(INPUT_TIME_CONFIG);

    /**
     * The time of the input, as 'HH:mm', undefined while it holds no complete time.
     */
    readonly value: ModelSignal<string | undefined> = model<string>();

    /**
     * The times that are allowed, as 'HH:mm', like the slots of appointments. Without them, every step minutes from min
     * to max are.
     */
    readonly times: InputSignal<readonly string[] | undefined> = input<readonly string[]>();

    /**
     * The earliest allowed time, as 'HH:mm'.
     */
    readonly min: InputSignal<string | undefined> = input<string>();

    /**
     * The latest allowed time, as 'HH:mm'.
     */
    readonly max: InputSignal<string | undefined> = input<string>();

    /**
     * How many minutes are between two allowed times, counted from min or midnight, without times. The default comes from
     * provideInputTimeConfig.
     */
    readonly step: InputSignal<number> = input<number>(this.timeConfig.step);

    /**
     * The color of the header of the picker. The default comes from provideInputTimeConfig.
     */
    readonly color: InputSignal<InputCalendarColor> = input<InputCalendarColor>(this.timeConfig.color);

    /**
     * The format the input shows its time in.
     */
    private readonly format: Intl.DateTimeFormat = InputTimeUtilities.resolveFormat(inject(LOCALE_ID));

    /**
     * The text of the input, which is only a time once it is complete.
     */
    protected readonly text: WritableSignal<string> = signal('');

    /**
     * The placeholder, by default an example of a time in the format of the input, like '6:30 PM'.
     */
    protected readonly shownPlaceholder: Signal<string> = computed(() => {
        return this.placeholder() ?? InputTimeUtilities.resolveText('18:30', this.format);
    });

    // the browser only knows that a text is required, it can't read a time. Whether the text is one and whether it is
    // allowed are checked by resolveCustomError, with the messages of the native errors.
    /**
     * The errors of the native ValidityState a time can have.
     */
    protected readonly validityErrors: readonly InputValidityError[] = ['valueMissing'];

    /**
     * The name of the button that opens the picker, and of the picker.
     */
    protected readonly timePickerLabel: string = this.timeConfig.timePickerLabel;

    /**
     * The icon of the button that opens the picker.
     */
    protected readonly timePickerIcon: IconDefinition = faClock;

    /**
     * The tailwind classes of the button that opens the picker.
     */
    protected readonly pickerButtonClasses: string = INPUT_DATE_CALENDAR_BUTTON_CLASSES;

    /**
     * The tailwind classes of the popover of the picker, like the one of the calendar of a date input.
     */
    protected readonly pickerClasses: Signal<string> = computed(() => {
        return `${INPUT_DATE_CALENDAR_CLASSES} ${INPUT_DATE_CALENDAR_BORDER_CLASSES[this.color()]}`;
    });

    /**
     * The id of the popover of the picker, which its button points to.
     */
    protected readonly pickerId: Signal<string> = computed(() => `${this.inputId()}-picker`);

    /**
     * Whether the picker is open, which the browser decides.
     */
    protected readonly pickerOpen: WritableSignal<boolean> = signal(false);

    /**
     * The times the picker offers.
     */
    protected readonly offeredTimes: Signal<readonly string[]> = computed(() => {
        return this.times() ?? InputTimeUtilities.resolveTimes(this.min() ?? FIRST_TIME, this.max() ?? LAST_TIME, this.step());
    });

    private readonly picker: Signal<ElementRef<HTMLElement>> = viewChild.required<ElementRef<HTMLElement>>('picker');

    constructor() {
        super();
        // like a date input: while the user types a time, it often isn't complete yet. That reads as undefined, and
        // writing undefined back would delete what they typed.
        effect(() => {
            const value: string | undefined = this.value();
            untracked(() => {
                if (InputTimeUtilities.findTimeInText(this.text(), this.format) !== value) {
                    this.text.set(value == undefined ? '' : InputTimeUtilities.resolveText(value, this.format));
                }
            });
        });
    }

    /**
     * Takes what the user typed as the text, and the time in it as the value.
     * @param text - The text of the input.
     */
    protected updateText(text: string): void {
        this.text.set(text);
        this.value.set(InputTimeUtilities.findTimeInText(text, this.format));
    }

    /**
     * Writes the time the user typed in the format of the input, like '9:30 AM' for '9.30', and shows the validation
     * error from now on.
     */
    protected finishTyping(): void {
        const value: string | undefined = this.value();
        if (value != undefined) {
            this.text.set(InputTimeUtilities.resolveText(value, this.format));
        }
        this.showValidationError.set(true);
    }

    /**
     * Takes the time the user chose in the picker as the value, closes the picker and focuses the input again.
     * @param time - The time, as 'HH:mm'.
     */
    protected choose(time: string): void {
        this.value.set(time);
        this.showValidationError.set(true);
        this.picker().nativeElement.hidePopover();
        this.focus();
    }

    /**
     * Resolves whether the text is a time within min and max, then whether it is one of the allowed times, then the
     * custom validation.
     * @returns The message, or undefined when the text is empty or such a time.
     */
    protected override resolveCustomError(): string | undefined {
        const value: string | undefined = this.value();
        if (this.text().trim() !== '' && value == undefined) {
            return this.config.errorMessages.badInput;
        }
        return value == undefined ? super.resolveCustomError() : this.resolveTimeError(value) ?? super.resolveCustomError();
    }

    /**
     * Resolves the room for the button that opens the picker.
     * @returns The tailwind classes.
     */
    protected override resolveExtraClasses(): string {
        return TIME_CLASSES;
    }

    // 'HH:mm' sorts like the times. Explicit times are the only allowed ones, otherwise the steps from min are, like the
    // step of a native time input.
    private resolveTimeError(value: string): string | undefined {
        const min: string | undefined = this.min();
        const max: string | undefined = this.max();
        if (min != undefined && value < min) {
            return this.config.errorMessages.rangeUnderflow;
        }
        if (max != undefined && value > max) {
            return this.config.errorMessages.rangeOverflow;
        }
        const times: readonly string[] | undefined = this.times();
        if (times != undefined) {
            return times.includes(value) ? undefined : this.config.errorMessages.timeNotAllowed;
        }
        const offset: number = InputTimeUtilities.resolveMinutes(value) - InputTimeUtilities.resolveMinutes(min ?? FIRST_TIME);
        return offset % this.step() === 0 ? undefined : this.config.errorMessages.stepMismatch;
    }
}
import { afterEveryRender, afterRenderEffect, booleanAttribute, computed, Directive, ElementRef, inject, input, InputSignal, InputSignalWithTransform, linkedSignal, model, ModelSignal, signal, Signal, viewChild, WritableSignal } from '@angular/core';

import { InputConfig } from './input-config.model';
import { INPUT_CONFIG } from './input-config.provider';
import { InputFieldState } from './input-field-state.model';
import { InputSize } from './input-size.type';
import { InputValidation } from './input-validation.type';
import { InputValidityError } from './input-validity-error.type';
import { NativeInputElement } from './native-input-element.type';

// the outline covers the border while focused. Invalid only colors border and outline, the message below says what
// is wrong, so color is never the only cue. Every size uses text-body: iOS zooms into the page when an input with
// smaller text gets focused.
const INPUT_CLASSES: string = `
    block w-full rounded-input border border-outline text-body text-on-surface transition
    placeholder:text-on-surface-variant
    hover:border-on-surface-variant
    focus:outline-2 focus:-outline-offset-1 focus:outline-primary
    disabled:pointer-events-none disabled:opacity-50
    aria-invalid:border-error
    aria-invalid:hover:border-error
    aria-invalid:focus:outline-error
`;

// by the readonly input rather than the :read-only pseudo-class, which a select always matches.
const BACKGROUND_CLASSES: Record<'editable' | 'readonly', string> = {
    editable: 'bg-surface',
    readonly: 'bg-surface-container'
};

// a min-h like buttons, so an input and a button of the same size line up.
const SIZE_CLASSES: Record<InputSize, string> = {
    sm: 'min-h-8 px-2.5 py-0.5',
    md: 'min-h-10 px-3 py-1.5',
    lg: 'min-h-12 px-4 py-2.5'
};

/**
 * What decides which error keeps its space below the input.
 */
type ReservedErrorSource = {
    /**
     * Whether the validation error shows.
     */
    show: boolean,
    /**
     * The message of the error that shows now.
     */
    error: string | undefined
};

// one counter for every control, so no two of them get the same id.
let nextId: number = 0;

/**
 * What every input of ui has: its label, hint and validation error, the rules every native input knows and the state
 * of its validation. A control extends it, declares its value and its own rules, and renders ui-input-field around a
 * native input, textarea or select marked #nativeInput, whose type it passes as the second type parameter.
 * The browser validates the native input, so a form only submits when it is valid. The error shows once the user left
 * the input or tried to submit its form, or when showValidationError is set to true.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Directive()
export abstract class BaseInputDirective<T, E extends NativeInputElement = HTMLInputElement> implements InputFieldState {
    /**
     * The values of the inputs that are not set, from provideInputConfig.
     */
    protected readonly config: InputConfig = inject(INPUT_CONFIG);

    /**
     * The native input of the control, marked #nativeInput in its template.
     */
    protected readonly nativeInput: Signal<ElementRef<E>> = viewChild.required<ElementRef<E>>('nativeInput');

    // ValidityState isn't a signal, so the input reads it again after every render.
    private readonly validityError: WritableSignal<InputValidityError | undefined> = signal(undefined);

    /**
     * The value of the input.
     */
    abstract readonly value: ModelSignal<T>;

    /**
     * What the input is for, shown above it and read by screen readers.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * Whether the label is only read by screen readers, not shown, for an input whose purpose is already clear from
     * where it is, like the filter in the header of a column.
     */
    readonly hideLabel: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the input takes the focus as the dialog or popover it is in opens, like its native autofocus.
     */
    readonly autofocus: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Text that helps filling in the input, like the expected format. The error replaces it while it shows.
     */
    readonly hint: InputSignal<string | undefined> = input<string>();

    /**
     * Whether the validation error shows. Becomes true when the user leaves the input or tries to submit its form, so
     * nobody sees an error before they had the chance to fill it in. Set it to show or hide the error yourself.
     */
    readonly showValidationError: ModelSignal<boolean> = model(false);

    /**
     * Whether the input needs a value. The default comes from provideInputConfig.
     */
    readonly required: InputSignalWithTransform<boolean, unknown> = input(this.config.required, { transform: booleanAttribute });

    /**
     * Checks a rule the browser can't check itself. It gets every value, also an empty one, and returns the error
     * message or undefined. The other rules, like required, are checked first. Signals it reads are tracked, so it can
     * compare with another value, like a repeated password. Like any invalid native input, the error blocks submitting
     * the form.
     */
    readonly customValidation: InputSignal<InputValidation<T> | undefined> = input<InputValidation<T>>();

    /**
     * Whether the input can't be used.
     */
    readonly disabled: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the value can be read and focused, but not changed.
     */
    readonly readonly: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * An example of the expected value, shown while the input is empty. Not a replacement for the label or hint.
     */
    readonly placeholder: InputSignal<string | undefined> = input<string>();

    /**
     * What the browser may fill in, like 'email' or 'transaction-amount'.
     */
    readonly autocomplete: InputSignal<string | undefined> = input<string>();

    /**
     * The name of the input, which forms submit the value under and password managers use to recognize it.
     */
    readonly name: InputSignal<string | undefined> = input<string>();

    /**
     * The id of the native input, which the label points to. Generated when not set.
     * Not called id, which would put the same id on the component's own element as well.
     */
    readonly inputId: InputSignal<string> = input(`ui-input-${nextId++}`);

    /**
     * The height and padding of the input.
     */
    readonly size: InputSignal<InputSize> = input<InputSize>(this.config.size);

    /**
     * The id of the label, for an element the label can't point to, like the combobox of a select.
     */
    readonly labelId: Signal<string> = computed(() => `${this.inputId()}-label`);

    /**
     * The id of the hint, which the native input points to.
     */
    readonly hintId: Signal<string> = computed(() => `${this.inputId()}-hint`);

    /**
     * The id of the error, which the native input points to.
     */
    readonly errorId: Signal<string> = computed(() => `${this.inputId()}-error`);

    /**
     * The anchor-name of the native input, which a list it opens is placed at, see InputPopupDirective.
     */
    readonly anchorName: Signal<string> = computed(() => `--${this.inputId()}`);

    /**
     * The message of the validation error, while it shows.
     */
    readonly errorMessage: Signal<string | undefined> = computed(() => {
        if (!this.showValidationError()) {
            return undefined;
        }
        const error: InputValidityError | undefined = this.validityError();
        return error == undefined ? this.customError() : this.config.errorMessages[error];
    });

    /**
     * The last error that showed, which keeps its space below the input while showValidationError is true.
     */
    // without it the fields below would move up and down with every keystroke that fixes or breaks the value. The one
    // move left happens when the user leaves the input or submits, where they expect the page to react.
    readonly reservedError: Signal<string | undefined> = linkedSignal<ReservedErrorSource, string | undefined>({
        source: () => ({ show: this.showValidationError(), error: this.errorMessage() }),
        computation: (source, previous) => source.show ? source.error ?? previous?.value : undefined
    });

    /**
     * The message of the rules the native input doesn't check, shown when the native rules pass.
     */
    protected readonly customError: Signal<string | undefined> = computed(() => this.resolveCustomError());

    /**
     * The id of whichever of hint and error shows, for the aria-describedby of the native input.
     */
    readonly describedBy: Signal<string | undefined> = computed(() => {
        if (this.errorMessage() != undefined) {
            return this.errorId();
        }
        return this.hint() == undefined ? undefined : this.hintId();
    });

    /**
     * The tailwind classes of the native input for the current size.
     */
    protected readonly inputClasses: Signal<string> = computed(() => {
        const background: string = BACKGROUND_CLASSES[this.readonly() ? 'readonly' : 'editable'];
        return [INPUT_CLASSES, background, SIZE_CLASSES[this.size()], this.resolveExtraClasses()].join(' ');
    });

    /**
     * The errors of the native ValidityState the control can have, in the order they are checked. The first one that
     * is true shows.
     */
    protected abstract readonly validityErrors: readonly InputValidityError[];

    constructor() {
        // an effect instead of setting it in afterEveryRender: the custom error can change without a render of this
        // input, like when it compares with a signal of the consumer while the error is hidden. The write phase runs
        // before the validity is read below.
        afterRenderEffect({
            write: () => this.nativeInput().nativeElement.setCustomValidity(this.customError() ?? '')
        });
        afterEveryRender(() => {
            const validity: ValidityState = this.nativeInput().nativeElement.validity;
            this.validityError.set(this.validityErrors.find(error => validity[error]));
        });
    }

    /**
     * Focuses the native input.
     * @param options - How to focus it.
     */
    focus(options?: FocusOptions): void {
        this.nativeInput().nativeElement.focus(options);
    }

    /**
     * Shows the validation error instead of the popup of the browser, when a form was submitted with an invalid value.
     * @param event - The invalid event of the native input.
     */
    protected showInsteadOfPopup(event: Event): void {
        // the popup only shows one field at a time, in the language of the browser instead of the app.
        event.preventDefault();
        this.showValidationError.set(true);
    }

    /**
     * Resolves the message of the rules the native input doesn't check. A control with rules of its own checks them
     * before the custom validation.
     * @returns The message, or undefined when the value meets them.
     */
    protected resolveCustomError(): string | undefined {
        return this.customValidation()?.(this.value());
    }

    /**
     * Resolves the classes a control adds to its native input, like room for a button over it.
     * @returns The tailwind classes.
     */
    protected resolveExtraClasses(): string {
        return '';
    }
}
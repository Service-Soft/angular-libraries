import { Component, input, InputSignal, model, ModelSignal } from '@angular/core';
import { BaseInputDirective, InputFieldComponent, InputUtilities, InputValidityError } from '@service-soft/ui/input';

// resized by the user in height only, so it never grows out of its column. It grows into the height its field gets,
// like from spanning two rows of a grid, and is never lower than its rows.
const TEXTAREA_CLASSES: string = 'grow resize-y';

/**
 * An input for a longer text of several lines, like a message or a description, with its label, hint and validation
 * error. Bind its value two-way with [(value)]. The browser validates it like any native textarea, so a form only
 * submits when it is valid. The error shows once the user left it or tried to submit its form, or when
 * showValidationError is set to true.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-textarea',
    templateUrl: './input-textarea.component.html',
    imports: [InputFieldComponent],
    host: {
        class: 'flex flex-col'
    }
})
export class InputTextareaComponent extends BaseInputDirective<string, HTMLTextAreaElement> {
    /**
     * The text of the textarea.
     */
    readonly value: ModelSignal<string> = model('');

    /**
     * How many lines of text it shows before the user resizes it. The default comes from provideInputConfig.
     */
    readonly rows: InputSignal<number> = input(this.config.textareaRows);

    /**
     * The least number of characters. An empty text is only checked by required.
     */
    readonly minLength: InputSignal<number | undefined> = input<number>();

    /**
     * The most number of characters. Like the native maxlength, the browser doesn't let the user type more, and a
     * longer text set from code is invalid.
     */
    readonly maxLength: InputSignal<number | undefined> = input<number>();

    /**
     * The errors of the native ValidityState a textarea can have, in the order they are checked.
     */
    protected readonly validityErrors: readonly InputValidityError[] = ['valueMissing', 'tooShort', 'tooLong'];

    /**
     * Resolves the message of the length rules and the custom validation for the current text.
     * @returns The message, or undefined when the text meets them.
     */
    protected override resolveCustomError(): string | undefined {
        return InputUtilities.resolveLengthError(this.value(), this.minLength(), this.maxLength(), this.config)
            ?? super.resolveCustomError();
    }

    /**
     * Resolves the classes that let the user resize the textarea in height.
     * @returns The tailwind classes.
     */
    protected override resolveExtraClasses(): string {
        return TEXTAREA_CLASSES;
    }
}
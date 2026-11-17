import { afterRenderEffect, Component, input, InputSignal, model, ModelSignal } from '@angular/core';
import { BaseInputDirective, InputFieldComponent, InputValidityError } from '@service-soft/ui/input';

import { InputNumberStep } from './input-number-step.type';
import { InputNumberType } from './input-number-type.type';

/**
 * An input for a number, like an amount or an age, with its label, hint and validation error.
 * Bind its value two-way with [(value)], which is undefined while the input is empty. The browser validates it like
 * any native number input, so a form only submits when it is valid. The error shows once the user left the input or
 * tried to submit its form, or when showValidationError is set to true.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-number',
    templateUrl: './input-number.component.html',
    imports: [InputFieldComponent],
    host: {
        class: 'flex flex-col'
    }
})
export class InputNumberComponent extends BaseInputDirective<number | undefined> {
    /**
     * The number of the input, undefined while it is empty or its text is no number.
     */
    readonly value: ModelSignal<number | undefined> = model<number>();

    /**
     * The type of the native input. It sets the keyboard on phones.
     */
    readonly type: InputSignal<InputNumberType> = input<InputNumberType>('number');

    /**
     * The smallest allowed number, like the native min.
     */
    readonly min: InputSignal<number | undefined> = input<number>();

    /**
     * The largest allowed number, like the native max.
     */
    readonly max: InputSignal<number | undefined> = input<number>();

    /**
     * The steps the number has to be on, counted from min, like the native step. Like there, it is 1 when not set, so
     * only whole numbers are valid. Use 'any' for every number, or 0.01 for amounts of money.
     */
    readonly step: InputSignal<InputNumberStep | undefined> = input<InputNumberStep>();

    // no own checks of min and max, unlike the lengths of ui-input-string: the browser checks the range of every value,
    // also one set from code. badInput comes first: a text that is no number, like '-', reads as empty, and "required"
    // would be the wrong thing to tell the user.
    /**
     * The errors of the native ValidityState a number can have, in the order they are checked.
     */
    protected readonly validityErrors: readonly InputValidityError[] = [
        'badInput',
        'valueMissing',
        'rangeUnderflow',
        'rangeOverflow',
        'stepMismatch'
    ];

    constructor() {
        super();
        // not a [value] binding like ui-input-string: while the user types a number, its text often is none yet, like
        // '-' or '1e'. That reads as undefined, and writing undefined back would delete what they typed. So the value
        // is only written when it differs from the number the text reads as.
        afterRenderEffect({
            write: () => {
                const value: number | undefined = this.value();
                if (value !== this.getTypedNumber()) {
                    this.nativeInput().nativeElement.value = value == undefined ? '' : String(value);
                }
            }
        });
    }

    /**
     * Takes the number the user typed as the value.
     */
    protected updateValue(): void {
        this.value.set(this.getTypedNumber());
    }

    // NaN is what the native input reads for an empty text and for one that is no number.
    private getTypedNumber(): number | undefined {
        const typed: number = this.nativeInput().nativeElement.valueAsNumber;
        return Number.isNaN(typed) ? undefined : typed;
    }
}
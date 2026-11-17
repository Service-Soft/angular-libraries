import { Signal } from '@angular/core';

/**
 * What ui-input-field shows of a control: its label, hint and validation error.
 */
export type InputFieldState = {
    /**
     * What the control is for, shown above it.
     */
    label: Signal<string>,
    /**
     * Whether the label is only read by screen readers, not shown.
     */
    hideLabel: Signal<boolean>,
    /**
     * Text that helps filling in the control. The error replaces it while it shows.
     */
    hint: Signal<string | undefined>,
    /**
     * Whether the control needs a value, which marks the label.
     */
    required: Signal<boolean>,
    /**
     * The id of the native element, which the label points to.
     */
    inputId: Signal<string>,
    /**
     * The id of the label, for an element the label can't point to, like the combobox of a select.
     */
    labelId: Signal<string>,
    /**
     * The id of the hint, which the native element points to.
     */
    hintId: Signal<string>,
    /**
     * The id of the error, which the native element points to.
     */
    errorId: Signal<string>,
    /**
     * The message of the validation error, while it shows.
     */
    errorMessage: Signal<string | undefined>,
    /**
     * The last error that showed, which keeps its space below the control while the error may show.
     */
    reservedError: Signal<string | undefined>,
    /**
     * The id of whichever of hint and error shows, which describes the native element, or the fieldset of a group.
     */
    describedBy: Signal<string | undefined>
};
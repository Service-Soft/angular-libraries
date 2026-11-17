/**
 * Checks a value for a rule the browser can't check itself. Returns the error message to show, or undefined when the
 * value is valid.
 */
export type InputValidation<T> = (value: T) => string | undefined;
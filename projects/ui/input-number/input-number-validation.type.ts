/**
 * Checks a number for a rule the browser can't check itself, like whether it is even.
 * Gets undefined while the input is empty. Returns the error message to show, or undefined when the number is valid.
 */
export type InputNumberValidation = (value: number | undefined) => string | undefined;
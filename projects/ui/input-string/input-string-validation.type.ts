/**
 * Checks a text for a rule the browser can't check itself, like whether a username is still free.
 * Returns the error message to show, or undefined when the text is valid.
 */
export type InputStringValidation = (value: string) => string | undefined;
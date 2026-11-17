import { InputConfig } from './input-config.model';

/**
 * Checks that the inputs of ui share.
 */
export abstract class InputUtilities {
    /**
     * Resolves the error of the length rules of a text. An empty text is only checked by required.
     * @param value - The text.
     * @param minLength - The least number of characters, if any.
     * @param maxLength - The most number of characters, if any.
     * @param config - The config with the messages of the errors.
     * @returns The message, or undefined when the text has an allowed length.
     */
    // the browser only checks minlength and maxlength when the user typed the text, so a too short text set from code,
    // like a prefilled form, would be submitted. When the user typed it, the native error is the same one.
    static resolveLengthError(
        value: string,
        minLength: number | undefined,
        maxLength: number | undefined,
        config: InputConfig
    ): string | undefined {
        if (value !== '' && minLength != undefined && value.length < minLength) {
            return config.errorMessages.tooShort;
        }
        return maxLength != undefined && value.length > maxLength ? config.errorMessages.tooLong : undefined;
    }

    /**
     * Resolves the error of a pattern a whole text has to match, like the native pattern attribute, for an input that
     * has none, like a combobox. An empty text is only checked by required.
     * @param value - The text.
     * @param pattern - The source of the regular expression, if any.
     * @param config - The config with the messages of the errors.
     * @returns The message, or undefined when the text matches.
     */
    static resolvePatternError(value: string, pattern: string | undefined, config: InputConfig): string | undefined {
        // the v flag and the anchors are what the browser uses for the pattern attribute.
        const matches: boolean = value === '' || pattern == undefined || new RegExp(`^(?:${pattern})$`, 'v').test(value);
        return matches ? undefined : config.errorMessages.patternMismatch;
    }
}
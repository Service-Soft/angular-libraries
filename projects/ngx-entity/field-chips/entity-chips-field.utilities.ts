import { NumberArrayItemMetadata, StringArrayItemMetadata } from '@service-soft/ngx-entity/entity';
import { InputConfig, InputUtilities } from '@service-soft/ui/input';

/**
 * What the items of chips are: strings or numbers.
 */
export type EntityChipsItemMetadata = StringArrayItemMetadata | NumberArrayItemMetadata;

/**
 * Turns what the user types into the chips of an array, by the rules of its items.
 */
export abstract class EntityChipsFieldUtilities {
    /**
     * Resolves the item a typed text is, when it meets the rules of the items.
     * @param items - What the items are.
     * @param text - The text, without the spaces around it.
     * @param config - The config of the inputs.
     * @returns The item, or undefined when the text breaks a rule.
     */
    static resolveItem(items: EntityChipsItemMetadata, text: string, config: InputConfig): string | number | undefined {
        if (text === '' || this.resolveItemError(items, text, config) != undefined) {
            return undefined;
        }
        return items.type === 'number' ? Number(text) : text;
    }

    /**
     * Resolves the error of a typed text by the rules of the items: its length and pattern, or whether it is a number
     * of the format between min and max.
     * @param items - What the items are.
     * @param text - The text, without the spaces around it. An empty one has no error.
     * @param config - The config with the messages of the errors.
     * @returns The message, or undefined when the text meets the rules.
     */
    static resolveItemError(items: EntityChipsItemMetadata, text: string, config: InputConfig): string | undefined {
        if (text === '') {
            return undefined;
        }
        const { type } = items;
        return type === 'string' ? this.resolveStringError(items, text, config) : this.resolveNumberError(items, Number(text), config);
    }

    private static resolveStringError(items: StringArrayItemMetadata, text: string, config: InputConfig): string | undefined {
        const source: string | undefined = items.regex instanceof RegExp ? items.regex.source : items.regex;
        return InputUtilities.resolveLengthError(text, items.minLength, items.maxLength, config)
            ?? InputUtilities.resolvePatternError(text, source, config);
    }

    private static resolveNumberError(items: NumberArrayItemMetadata, value: number, config: InputConfig): string | undefined {
        if (Number.isNaN(value)) {
            return config.errorMessages.badInput;
        }
        if (items.format === 'integer' && !Number.isInteger(value)) {
            return config.errorMessages.stepMismatch;
        }
        if (items.min != undefined && value < items.min) {
            return config.errorMessages.rangeUnderflow;
        }
        return items.max != undefined && value > items.max ? config.errorMessages.rangeOverflow : undefined;
    }
}
import { NumberFormat } from './number-property-metadata.model';

/**
 * What the strings of an array say about themselves, with every value set: they show as chips.
 */
export type StringArrayItemMetadata = {
    /**
     * The kind of the items.
     */
    type: 'string',
    /**
     * The enum the items are of, which makes the chips choose from its values.
     */
    enum: Record<string, string> | undefined,
    /**
     * Strings the input suggests while the user types, like tags used before.
     */
    options: string[] | undefined,
    /**
     * Whether only the options can be chosen, nothing the user types.
     */
    restrictToOptions: boolean,
    /**
     * The least number of characters of an item.
     */
    minLength: number | undefined,
    /**
     * The most number of characters of an item.
     */
    maxLength: number | undefined,
    /**
     * A pattern the whole of an item has to match.
     */
    regex: RegExp | string | undefined
};

/**
 * What the numbers of an array say about themselves, with every value set: they show as chips.
 */
export type NumberArrayItemMetadata = {
    /**
     * The kind of the items.
     */
    type: 'number',
    /**
     * The enum the items are of, which makes the chips choose from the names of its members.
     */
    enum: Record<string, string | number> | undefined,
    /**
     * Any number, or a whole one.
     */
    format: NumberFormat,
    /**
     * The smallest item.
     */
    min: number | undefined,
    /**
     * The largest item.
     */
    max: number | undefined
};

/**
 * What the strings of an array say about themselves: every value that differs from its default.
 */
export type StringArrayItemMetadataInput = Pick<StringArrayItemMetadata, 'type'> & Partial<Omit<StringArrayItemMetadata, 'type'>>;

/**
 * What the numbers of an array say about themselves: every value that differs from its default.
 */
export type NumberArrayItemMetadataInput = Pick<NumberArrayItemMetadata, 'type'> & Partial<Omit<NumberArrayItemMetadata, 'type'>>;
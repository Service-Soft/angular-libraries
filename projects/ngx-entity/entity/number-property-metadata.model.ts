import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';

/**
 * The formats of a number in a form: any number, or a whole one.
 */
export type NumberFormat = 'number' | 'integer';

/**
 * How the field of a number shows: an input to type it, or a slider between min and max. A number with an enum is a
 * select.
 */
export type NumberDisplayStyle = 'line' | 'slider';

/**
 * What a number property says about itself, with every value set.
 */
export type NumberPropertyMetadata<T> = BasePropertyMetadata<T, number> & {
    /**
     * The kind of the property.
     */
    type: 'number',
    /**
     * How the field shows.
     */
    displayStyle: NumberDisplayStyle,
    /**
     * Whether the value may have decimals.
     */
    format: NumberFormat,
    /**
     * The smallest value.
     */
    min: number | undefined,
    /**
     * The largest value.
     */
    max: number | undefined,
    /**
     * The enum the value is one of, which makes the field a select of its values.
     */
    enum: Record<string, string | number> | undefined
};

/**
 * What a number property says about itself: its label, and every other value that differs from its default.
 */
export type NumberPropertyMetadataInput<T> = BasePropertyMetadataInput<T, number>
    & Partial<Omit<NumberPropertyMetadata<T>, keyof BasePropertyMetadata<T, number> | 'type'>>;
import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';
import { NumberArrayItemMetadata, NumberArrayItemMetadataInput, StringArrayItemMetadata, StringArrayItemMetadataInput } from './chips-array-item-metadata.model';
import { DateArrayItemMetadata, DateArrayItemMetadataInput } from './date-array-item-metadata.model';
import { ObjectArrayItemMetadata, ObjectArrayItemMetadataInput } from './object-array-item-metadata.model';

/**
 * What the items of an array say about themselves, by their `type`, with every value set.
 */
export type ArrayItemMetadata<T> = StringArrayItemMetadata | NumberArrayItemMetadata | DateArrayItemMetadata<T> | ObjectArrayItemMetadata;

/**
 * What the items of an array say about themselves, by their `type`: every value that differs from its default.
 */
export type ArrayItemMetadataInput<T, O> = StringArrayItemMetadataInput
    | NumberArrayItemMetadataInput
    | DateArrayItemMetadataInput<T>
    | ObjectArrayItemMetadataInput<O>;

/**
 * What an array property says about itself, with every value set.
 */
export type ArrayPropertyMetadata<T> = BasePropertyMetadata<T, unknown[]> & {
    /**
     * The kind of the property.
     */
    type: 'array',
    /**
     * What its items are.
     */
    items: ArrayItemMetadata<T>
};

/**
 * What an array property says about itself, like zibri's: its label, its items, and every other value that differs
 * from its default.
 */
export type ArrayPropertyMetadataInput<T, O> = BasePropertyMetadataInput<T, unknown[]> & {
    /**
     * What its items are, by their `type`: strings and numbers show as chips, dates and date ranges in a table with
     * the inputs that add one, objects in a table with a dialog of their fields.
     */
    items: ArrayItemMetadataInput<T, O>
};
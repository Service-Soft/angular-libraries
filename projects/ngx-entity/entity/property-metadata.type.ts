import { ArrayPropertyMetadata } from './array-property-metadata.model';
import { BooleanPropertyMetadata } from './boolean-property-metadata.model';
import { CustomPropertyMetadata } from './custom-property-metadata.model';
import { DatePropertyMetadata } from './date-property-metadata.model';
import { DateRangePropertyMetadata } from './date-range-property-metadata.model';
import { NumberPropertyMetadata } from './number-property-metadata.model';
import { ObjectPropertyMetadata } from './object-property-metadata.model';
import { OneToManyPropertyMetadata } from './one-to-many-property-metadata.model';
import { StringPropertyMetadata } from './string-property-metadata.model';
import { ToOnePropertyMetadata } from './to-one-property-metadata.model';

/**
 * What a property of an entity says about itself, by its `type`.
 */
export type PropertyMetadata<T> = StringPropertyMetadata<T>
    | NumberPropertyMetadata<T>
    | BooleanPropertyMetadata<T>
    | DatePropertyMetadata<T>
    | DateRangePropertyMetadata<T>
    | ObjectPropertyMetadata<T>
    | ArrayPropertyMetadata<T>
    | ToOnePropertyMetadata<T>
    | OneToManyPropertyMetadata<T>
    | CustomPropertyMetadata<T>;
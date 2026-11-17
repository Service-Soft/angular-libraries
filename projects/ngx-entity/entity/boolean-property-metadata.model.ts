import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';
import { EntityCondition } from './entity-condition.type';

/**
 * How the field of a boolean shows: a checkbox, or a switch for a setting that applies right away.
 */
export type BooleanDisplayStyle = 'checkbox' | 'switch';

/**
 * What a boolean property says about itself, with every value set. Its field always has a value, so `required` only
 * says that the property has to be sent; `mustBeChecked` says that it has to be true.
 */
export type BooleanPropertyMetadata<T> = BasePropertyMetadata<T, boolean> & {
    /**
     * The kind of the property.
     */
    type: 'boolean',
    /**
     * How the field shows. Undefined for what the inputs of the app use, see provideInputConfig.
     */
    displayStyle: BooleanDisplayStyle | undefined,
    /**
     * Whether the user has to check the field before the form can be saved, like accepting the terms.
     */
    mustBeChecked: EntityCondition<T>
};

/**
 * What a boolean property says about itself: its label, and every other value that differs from its default.
 */
export type BooleanPropertyMetadataInput<T> = BasePropertyMetadataInput<T, boolean>
    & Partial<Omit<BooleanPropertyMetadata<T>, keyof BasePropertyMetadata<T, boolean> | 'type'>>;
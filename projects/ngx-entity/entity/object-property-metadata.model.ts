import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';
import { EntityClass } from './entity-class.type';
import { ObjectOption } from './object-option.model';

/**
 * How the field of an object shows: the fields of its own properties, or a select of fixed objects.
 */
export type ObjectDisplayStyle = 'inline' | 'dropdown';

/**
 * The fixed objects a select of an object offers: a list, or a function of the entity that resolves it.
 */
export type ObjectOptions<T, O> = ObjectOption<O>[] | ((entity: Partial<T>) => ObjectOption<O>[]);

/**
 * What an object property says about itself, with every value set, like an address that is part of a customer.
 */
export type ObjectPropertyMetadata<T> = BasePropertyMetadata<T, object> & {
    /**
     * The kind of the property.
     */
    type: 'object',
    /**
     * The class whose decorators describe the properties of the object.
     */
    cls: () => EntityClass<object>,
    /**
     * How the field shows.
     */
    displayStyle: ObjectDisplayStyle,
    /**
     * The objects a select offers, with its display style 'dropdown'.
     */
    options: ObjectOptions<T, object> | undefined
};

/**
 * What an object property says about itself: its label, its class, and every other value that differs from its
 * default. A select needs its options.
 */
export type ObjectPropertyMetadataInput<T, O> = BasePropertyMetadataInput<T, O> & {
    /**
     * The class whose decorators describe the properties of the object, in a function, like zibri's.
     */
    cls: () => EntityClass<O>
} & (
    {
        /**
         * The fields of the properties of the object, inside a group with its label. The default.
         */
        displayStyle?: 'inline'
    } | {
        /**
         * A select of fixed objects.
         */
        displayStyle: 'dropdown',
        /**
         * The objects to choose from.
         */
        options: ObjectOptions<T, O>
    }
);
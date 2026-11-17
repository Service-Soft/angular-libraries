import { Type } from '@angular/core';

import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';

/**
 * Loads the component of a field, like `async () => (await import('./color-field.component')).ColorFieldComponent`.
 */
export type CustomFieldLoader = () => Promise<Type<unknown>>;

/**
 * What a property with a field of its own says about itself, with every value set.
 */
export type CustomPropertyMetadata<T> = BasePropertyMetadata<T, unknown> & {
    /**
     * The kind of the property.
     */
    type: 'custom',
    /**
     * Loads the component of its field, which takes the inputs of BaseEntityFieldDirective, best by extending it.
     */
    component: CustomFieldLoader,
    /**
     * Whatever else the component needs, which it reads from the metadata of its property.
     */
    data: unknown
};

/**
 * What a property with a field of its own says about itself: its label, the component of its field, and every other
 * value that differs from its default.
 */
export type CustomPropertyMetadataInput<T, V> = BasePropertyMetadataInput<T, V> & {
    /**
     * Loads the component of its field, with an import(), so only the forms that show it load it.
     */
    component: CustomFieldLoader,
    /**
     * Whatever else the component needs, which it reads from the metadata of its property.
     */
    data?: unknown
};
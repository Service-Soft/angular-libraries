import { PropertyMetadata } from './property-metadata.type';

/**
 * A property of an entity class and what it says about itself.
 */
export type EntityProperty<T> = {
    /**
     * The name of the property, like 'title'.
     */
    key: string,
    /**
     * What the property says about itself.
     */
    metadata: PropertyMetadata<T>
};
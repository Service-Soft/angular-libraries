/**
 * A decorator of a property of an entity class, like the ones `Property` creates. TypeScript infers `T` from the class
 * it decorates, which types the conditions of the property.
 */
export type EntityPropertyDecorator<T> = (prototype: T, key: string) => void;
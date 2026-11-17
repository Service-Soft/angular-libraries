import { EntityCondition } from './entity-condition.type';
import { GridWidth } from './grid-width.type';
import { PropertyPosition } from './property-position.model';

/**
 * The value a new entity starts with: the value itself, or a function that creates it, like `() => new Date()`.
 */
export type PropertyDefault<V> = V | (() => V) | undefined;

/**
 * What every property says about itself, with every value set.
 */
export type BasePropertyMetadata<T, V> = {
    /**
     * The label of the field and the header of its column, like 'Due date'.
     */
    displayName: string,
    /**
     * A hint below the field, like 'When the task has to be done'.
     */
    description: string | undefined,
    /**
     * Whether the property needs a value. Like in zibri, true by default.
     */
    required: EntityCondition<T>,
    /**
     * Whether the form shows the field.
     */
    display: EntityCondition<T>,
    /**
     * Whether the field shows its value without letting the user change it.
     */
    readonly: EntityCondition<T>,
    /**
     * Whether the form that creates an entity leaves the field out, like an id the server sets.
     */
    omitForCreate: boolean,
    /**
     * Whether the form that edits an entity leaves the field out, like a value that can't change after creating.
     */
    omitForUpdate: boolean,
    /**
     * How many of the 12 columns the field takes on large, medium and small screens.
     */
    defaultWidths: [GridWidth, GridWidth, GridWidth],
    /**
     * Where the field shows in the form.
     */
    position: PropertyPosition,
    /**
     * The value a new entity starts with.
     */
    default: PropertyDefault<V>
};

/**
 * What every property says about itself: the label, and every other value that differs from its default.
 */
export type BasePropertyMetadataInput<T, V> = Pick<BasePropertyMetadata<T, V>, 'displayName'>
    & Partial<Omit<BasePropertyMetadata<T, V>, 'displayName'>>;
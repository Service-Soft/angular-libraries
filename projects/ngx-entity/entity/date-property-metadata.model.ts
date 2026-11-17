import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';

/**
 * How the field of a date shows: a day, or a day and a time of it.
 */
export type DateDisplayStyle = 'date' | 'datetime';

/**
 * A bound of a date, like zibri's `after` and `before`: always the same, or depending on the entity, like an end
 * that has to come after the start: `after: event => event.start`.
 */
export type DateBound<T> = Date | ((entity: Partial<T>) => Date | undefined);

/**
 * What a date property says about itself, with every value set.
 */
export type DatePropertyMetadata<T> = BasePropertyMetadata<T, Date> & {
    /**
     * The kind of the property.
     */
    type: 'date',
    /**
     * How the field shows.
     */
    displayStyle: DateDisplayStyle,
    /**
     * The earliest date.
     */
    after: DateBound<T> | undefined,
    /**
     * The latest date.
     */
    before: DateBound<T> | undefined
};

/**
 * What a date property says about itself: its label, and every other value that differs from its default.
 */
export type DatePropertyMetadataInput<T> = BasePropertyMetadataInput<T, Date>
    & Partial<Omit<DatePropertyMetadata<T>, keyof BasePropertyMetadata<T, Date> | 'type'>>;
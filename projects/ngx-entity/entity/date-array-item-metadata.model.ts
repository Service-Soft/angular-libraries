import { DateBound, DateDisplayStyle } from './date-property-metadata.model';

/**
 * What the dates or date ranges of an array say about themselves, with every value set: they show in a table, with the
 * inputs that add one below it.
 */
export type DateArrayItemMetadata<T> = {
    /**
     * The kind of the items: a date, or a DateRange from a start to an end.
     */
    type: 'date' | 'dateRange',
    /**
     * Whether the dates are days, or days and a time of them.
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
 * What the dates or date ranges of an array say about themselves: every value that differs from its default.
 */
export type DateArrayItemMetadataInput<T> = Pick<DateArrayItemMetadata<T>, 'type'> & Partial<Omit<DateArrayItemMetadata<T>, 'type'>>;
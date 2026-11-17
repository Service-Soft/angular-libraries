import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';
import { DateBound, DateDisplayStyle } from './date-property-metadata.model';
import { DateRange } from './date-range.model';

/**
 * What a date range property says about itself, with every value set, like the stay of a booking.
 */
export type DateRangePropertyMetadata<T> = BasePropertyMetadata<T, DateRange> & {
    /**
     * The kind of the property.
     */
    type: 'dateRange',
    /**
     * Whether the start and the end are days, or days and a time of them.
     */
    displayStyle: DateDisplayStyle,
    /**
     * The earliest start.
     */
    after: DateBound<T> | undefined,
    /**
     * The latest end.
     */
    before: DateBound<T> | undefined
};

/**
 * What a date range property says about itself: its label, and every other value that differs from its default.
 */
export type DateRangePropertyMetadataInput<T> = BasePropertyMetadataInput<T, DateRange>
    & Partial<Omit<DateRangePropertyMetadata<T>, keyof BasePropertyMetadata<T, DateRange> | 'type'>>;
import { TableColumn } from '@service-soft/ui/table';

/**
 * A column of ui-local-table: a column of ui-table, which can say how its rows are ordered and filtered when its text
 * isn't enough for that, like a date shown formatted.
 */
export type LocalTableColumn<T> = TableColumn<T> & {
    /**
     * Orders two rows by the column, less than 0 when a comes first. By default by their texts, numbers as numbers.
     */
    compare?: (a: T, b: T) => number,
    /**
     * Whether a row passes the filter of the column. By default a text filter matches a text that contains it,
     * ignoring case, and a select filter matches the text that is the label of the chosen option.
     */
    matches?: (row: T, filter: unknown) => boolean
};
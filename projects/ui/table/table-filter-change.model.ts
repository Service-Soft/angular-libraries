/**
 * A changed filter of a column of ui-table.
 */
export type TableFilterChange = {
    /**
     * The key of the column.
     */
    key: string,
    /**
     * What the column is filtered by now, undefined for nothing.
     */
    value: unknown
};
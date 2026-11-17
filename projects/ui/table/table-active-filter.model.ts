/**
 * A filter of ui-table that is set, as its badge in the footer shows it.
 */
export type TableActiveFilter = {
    /**
     * The key of the column.
     */
    key: string,
    /**
     * The column and what it is filtered by, like 'Name: al'.
     */
    text: string
};
/**
 * The order of the rows of ui-table: by one column, in a direction.
 */
export type TableOrder = {
    /**
     * The key of the column.
     */
    key: string,
    /**
     * Ascending or descending.
     */
    direction: 'ASC' | 'DESC'
};
/**
 * What the template of the actions of a row of ui-table gets: the row, as `let-row`.
 */
export type TableRowContext<T> = {
    /**
     * The row.
     */
    $implicit: T
};
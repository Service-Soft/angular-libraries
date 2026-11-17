import { TableColumn } from './table-column.model';

/**
 * What the template of a cell of ui-table gets: the row, as `let-row`, and its column.
 */
export type TableCellContext<T> = {
    /**
     * The row of the cell.
     */
    $implicit: T,
    /**
     * The column of the cell.
     */
    column: TableColumn<T>
};
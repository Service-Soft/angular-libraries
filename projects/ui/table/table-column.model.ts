import { TemplateRef } from '@angular/core';

import { TableCellContext } from './table-cell-context.model';
import { TableColumnFilter } from './table-column-filter.model';

/**
 * A column of ui-table.
 */
export type TableColumn<T> = {
    /**
     * What identifies the column, which the order and the filters of the table name it by, like 'name'.
     */
    key: string,
    /**
     * The header of the column, which a stacked row on a phone shows before each value as well.
     */
    label: string,
    /**
     * The text of the cell of a row, like its name or its date formatted for the user.
     */
    value: (row: T) => string,
    /**
     * Whether the table can be ordered by the column.
     */
    sortable?: boolean,
    /**
     * How the column is filtered, if it is.
     */
    filter?: TableColumnFilter,
    /**
     * A template for cells that need more than the text, like a status badge. It gets the row as `let-row`.
     */
    cell?: TemplateRef<TableCellContext<T>>,
    /**
     * Where the content of the column starts. Numbers read best aligned to the end.
     */
    align?: 'start' | 'end'
};
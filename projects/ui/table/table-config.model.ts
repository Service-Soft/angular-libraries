import { TableVariant } from './table-variant.type';

/**
 * The values a table uses when its inputs are not set, and its texts.
 */
export type TableConfig = {
    /**
     * How many rows a page has.
     */
    pageSize: number,
    /**
     * The page sizes the user can choose from below the table.
     */
    pageSizes: number[],
    /**
     * How the table is set apart from what is around it.
     */
    variant: TableVariant,
    /**
     * Whether every second row has a slightly different background.
     */
    striped: boolean,
    /**
     * The name of the checkbox that selects every row of the page.
     */
    selectAllLabel: string,
    /**
     * The name of the checkbox that selects a row, read together with the first value of the row.
     */
    selectRowLabel: string,
    /**
     * The name of the button in the header of a column that opens its filter, and of the input in there.
     */
    filterLabel: (column: string) => string,
    /**
     * The choice of a select filter that filters nothing.
     */
    allLabel: string,
    /**
     * What screen readers call the list of the badges of the filters that are set, below the table.
     */
    filtersLabel: string,
    /**
     * The name of the badge of a filter that is set, which removes it, from its column and value, like 'Name: al'.
     */
    removeFilterLabel: (filter: string) => string,
    /**
     * What screen readers call the pagination, from the label of the table, so the pagination of each table on a page
     * can be told apart from the others.
     */
    paginationLabel: (table: string) => string,
    /**
     * Which rows the page shows, from the number of its first and last row and how many there are, like
     * 'Showing 21–30 of 100'.
     */
    rangeLabel: (first: number, last: number, total: number) => string,
    /**
     * The label of the select below the table that changes how many rows a page has.
     */
    pageSizeLabel: string,
    /**
     * The header of the column of the actions of a row.
     */
    actionsLabel: string,
    /**
     * What the table says while it has no rows.
     */
    noRowsLabel: string,
    /**
     * What screen readers announce while the rows load.
     */
    loadingLabel: string
};
/**
 * The values a search toolbar and a filter button use when their inputs are not set.
 */
export type SearchToolbarConfig = {
    /**
     * The name of the search, which shows in it while it is empty.
     */
    searchLabel: string,
    /**
     * The text that says how many results there are, like '12 results'.
     */
    resultCountLabel: (count: number) => string,
    /**
     * What screen readers read after the name of a filter button about its active filters, like '2 active'.
     */
    activeFiltersLabel: (count: number) => string
};
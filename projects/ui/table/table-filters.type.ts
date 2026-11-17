/**
 * The filters of ui-table, by the key of their column: the text of a text filter, the value of the option of a select
 * filter. A column the user doesn't filter by is missing.
 */
export type TableFilters = Record<string, unknown>;
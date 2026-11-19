/**
 * The formats a data list uses for the items that don't set their own.
 */
export type DataListConfig = {
    /**
     * How dates are written.
     */
    dateFormat: Intl.DateTimeFormatOptions,
    /**
     * How numbers are written.
     */
    numberFormat: Intl.NumberFormatOptions
};
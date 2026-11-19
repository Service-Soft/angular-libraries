import { DataListValue } from './data-list-value.type';

/**
 * A label and its value, as a data list shows them.
 */
export type DataListItem = {
    /**
     * What the value is, like 'Customer number'.
     */
    label: string,
    /**
     * The value.
     */
    value: DataListValue,
    /**
     * How a date is written, like { dateStyle: 'full' }. The default comes from provideDataListConfig.
     */
    dateFormat?: Intl.DateTimeFormatOptions,
    /**
     * How a number is written, like { style: 'currency', currency: 'EUR' }. The default comes from
     * provideDataListConfig.
     */
    numberFormat?: Intl.NumberFormatOptions
};
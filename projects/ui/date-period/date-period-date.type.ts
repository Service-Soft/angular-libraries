/**
 * A date of a period: a Date, a timestamp or a string like '2022-02-14'. A date without a time, like '2022-02' or
 * '2022-02-14', is a day of the local calendar, not midnight in UTC.
 */
export type DatePeriodDate = Date | string | number;
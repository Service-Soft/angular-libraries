import { DatePeriodDate } from './date-period-date.type';

/**
 * The end of a period: a date, 'open' for one that is still going on, which shows as the openEndLabel, like
 * '02/2022 – today', or undefined for a single date.
 */
export type DatePeriodEnd = DatePeriodDate | 'open' | undefined;
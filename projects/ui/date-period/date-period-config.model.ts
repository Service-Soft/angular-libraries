import { DatePeriodFormat } from './date-period-format.type';

/**
 * The values a date period uses when its inputs or the arguments of its pipe are not set.
 */
export type DatePeriodConfig = {
    /**
     * How the dates are written.
     */
    format: DatePeriodFormat,
    /**
     * What shows as the end of a period that is still going on, like 'today'.
     */
    openEndLabel: string,
    /**
     * What stands between the start and the end, including its spaces.
     */
    separator: string
};
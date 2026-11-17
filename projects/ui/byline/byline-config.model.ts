import { DatePeriodFormat } from '@service-soft/ui/date-period';

/**
 * The values a byline uses when its inputs are not set.
 */
export type BylineConfig = {
    /**
     * Whether the author shows with an avatar in front of their name.
     */
    showAvatar: boolean,
    /**
     * How the date is written.
     */
    dateFormat: DatePeriodFormat,
    /**
     * The text of the reading time, from the minutes, like '5 min read'.
     */
    readingTimeLabel: (minutes: number) => string
};
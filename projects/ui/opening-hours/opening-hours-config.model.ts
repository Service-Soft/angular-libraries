import { InputWeekday } from '@service-soft/ui/input';

import { OpeningHoursDayFormat } from './opening-hours-day-format.type';

/**
 * The values opening hours use when their inputs are not set, and their texts.
 */
export type OpeningHoursConfig = {
    /**
     * The day the week starts with, like 1 for Monday or 0 for Sunday.
     */
    firstDayOfWeek: InputWeekday,
    /**
     * Whether days after each other with the same hours share a row, like 'Monday – Thursday'.
     */
    group: boolean,
    /**
     * Whether it says above the days whether it is open now.
     */
    status: boolean,
    /**
     * Whether the hours are marked up with schema.org microdata, which search engines read.
     */
    microdata: boolean,
    /**
     * The time zone of the business, like 'Europe/Berlin', or undefined for the one of the browser.
     */
    timeZone: string | undefined,
    /**
     * How the names of the days are written.
     */
    dayFormat: OpeningHoursDayFormat,
    /**
     * What screen readers call the table of the days.
     */
    label: string,
    /**
     * Shown for a day it is closed.
     */
    closedLabel: string,
    /**
     * Shown next to the day that is today.
     */
    todayLabel: string,
    /**
     * The status while it is open.
     */
    openNowLabel: string,
    /**
     * The status while it is closed.
     */
    closedNowLabel: string,
    /**
     * What screen readers read for the dash between two days or two times, like 'to'.
     */
    toLabel: string
};
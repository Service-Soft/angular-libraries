import { InputWeekday } from '@service-soft/ui/input';

import { OpeningHoursShownRange } from './opening-hours-shown-range.model';

/**
 * A row of opening hours as it shows: a day, or days after each other with the same hours, and their times.
 */
export type OpeningHoursRow = {
    /**
     * The days of the row, in the order of the week.
     */
    weekdays: InputWeekday[],
    /**
     * The name of the first day, like 'Monday'.
     */
    firstDay: string,
    /**
     * The name of the last day of several, like 'Thursday', or undefined for a row of one day.
     */
    lastDay: string | undefined,
    /**
     * The times it is open, empty for closed days.
     */
    ranges: OpeningHoursShownRange[],
    /**
     * The note below the times.
     */
    note: string | undefined,
    /**
     * The schema.org urls of the days, like 'https://schema.org/Monday'.
     */
    schemaDays: string[]
};
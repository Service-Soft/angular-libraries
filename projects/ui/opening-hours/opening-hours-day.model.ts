import { InputWeekday } from '@service-soft/ui/input';

import { OpeningHoursRange } from './opening-hours-range.model';

/**
 * The opening hours of a day of the week.
 */
export type OpeningHoursDay = {
    /**
     * The day, like Date.getDay returns it: 0 is Sunday, 1 Monday, up to 6 for Saturday.
     */
    weekday: InputWeekday,
    /**
     * The times it is open, like 08:00 to 12:00 and 14:00 to 18:00. Empty for a day it is closed, the same as leaving
     * the day out.
     */
    ranges: OpeningHoursRange[],
    /**
     * A note below the times, like 'Only by appointment'.
     */
    note?: string
};
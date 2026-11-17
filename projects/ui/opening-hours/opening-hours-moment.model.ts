import { InputWeekday } from '@service-soft/ui/input';

/**
 * A moment of the week in the time zone of a business.
 */
export type OpeningHoursMoment = {
    /**
     * The day of the week, 0 for Sunday up to 6 for Saturday.
     */
    weekday: InputWeekday,
    /**
     * The minutes since midnight, like 510 for 08:30.
     */
    minutes: number
};
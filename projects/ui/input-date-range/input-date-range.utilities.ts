import { InputDateUtilities } from '@service-soft/ui/input-date';
import { InputTimeUtilities } from '@service-soft/ui/input-time';

import { InputDateRangeDuration } from './input-date-range-duration.model';
import { InputDateRangeTimes } from './input-date-range-times.type';

const MINUTES_PER_HOUR: number = 60;
const MILLISECONDS_PER_HOUR: number = 3_600_000;

/**
 * The times and durations of a date range, in the time zone of the browser. The times of opening hours come from
 * InputTimeUtilities.resolveTimes of `@service-soft/ui/input-time`.
 */
export abstract class InputDateRangeUtilities {
    /**
     * Resolves the times a range can start or end at on a day.
     * @param times - The same times every day, or the function that returns the ones of a day.
     * @param day - The day.
     * @returns The times, as 'HH:mm'.
     */
    static resolveTimesOfDay(times: InputDateRangeTimes, day: Date): readonly string[] {
        return typeof times === 'function' ? times(day) : times;
    }

    /**
     * Resolves the moment of a time on a day.
     * @param day - Any moment of the day.
     * @param time - The time, as 'HH:mm', or undefined for midnight.
     * @returns The moment, in the time zone of the browser.
     */
    static resolveMoment(day: Date, time: string | undefined): Date {
        const minutes: number = time == undefined ? 0 : InputTimeUtilities.resolveMinutes(time);
        const hours: number = Math.floor(minutes / MINUTES_PER_HOUR);
        return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes % MINUTES_PER_HOUR);
    }

    /**
     * Resolves how much longer a range is than a duration, in the unit of the duration.
     * @param start - The start of the range.
     * @param end - The end of the range.
     * @param duration - The duration, in days or in hours.
     * @returns How many days or hours longer it is, negative when it is shorter.
     */
    static resolveDurationDifference(start: Date, end: Date, duration: InputDateRangeDuration): number {
        return 'days' in duration
            ? InputDateUtilities.resolveDaysBetween(start, end) - duration.days
            : ((end.getTime() - start.getTime()) / MILLISECONDS_PER_HOUR) - duration.hours;
    }
}
import { InputWeekday } from '@service-soft/ui/input';

import { OpeningHoursDayFormat } from './opening-hours-day-format.type';
import { OpeningHoursDay } from './opening-hours-day.model';
import { OpeningHoursMoment } from './opening-hours-moment.model';
import { OpeningHoursRange } from './opening-hours-range.model';
import { OpeningHoursRow } from './opening-hours-row.model';
import { OpeningHoursShownRange } from './opening-hours-shown-range.model';

const WEEK: InputWeekday[] = [0, 1, 2, 3, 4, 5, 6];

// the short names of en-US, which resolveMoment formats the day with, to read it back as a number.
const EN_US_WEEKDAYS: Partial<Record<string, InputWeekday>> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// the english names schema.org gives the days, by Date.getDay.
const SCHEMA_DAYS: Record<InputWeekday, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
};

// January 7 of 2024 is a Sunday, so the day weekday after it is that weekday, whose name Intl writes.
const A_SUNDAY: Date = new Date(2024, 0, 7);

const MINUTES_PER_HOUR: number = 60;

/**
 * Utilities for opening hours: the rows they show and whether they are open at a moment.
 */
export abstract class OpeningHoursUtilities {
    /**
     * Resolves the rows of a week, starting with its first day, with the names of the days and the times written in a
     * language. Days the week leaves out are closed.
     * @param week - The opening hours of the days.
     * @param firstDayOfWeek - The day the week starts with, like 1 for Monday.
     * @param group - Whether days after each other with the same hours and note share a row.
     * @param locale - The language the days and times are written in, like 'de'.
     * @param dayFormat - Whether the days are written in full or short.
     * @returns The rows, in the order of the week.
     */
    static resolveRows(
        week: OpeningHoursDay[],
        firstDayOfWeek: InputWeekday,
        group: boolean,
        locale: string,
        dayFormat: OpeningHoursDayFormat
    ): OpeningHoursRow[] {
        const dayNames: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, { weekday: dayFormat });
        const times: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
        const rows: OpeningHoursRow[] = [];
        let previousHours: string | undefined;
        for (const weekday of this.resolveWeekdays(firstDayOfWeek)) {
            const day: OpeningHoursDay | undefined = this.findDay(week, weekday);
            const ranges: OpeningHoursRange[] = day?.ranges ?? [];
            const name: string = dayNames.format(this.resolveDate(weekday));
            // compared by their values in their order, whatever order the properties were written in.
            const hours: string = JSON.stringify([ranges.map(range => [range.opens, range.closes]), day?.note]);
            const previous: OpeningHoursRow | undefined = rows.at(-1);
            const schemaDay: string = `https://schema.org/${SCHEMA_DAYS[weekday]}`;
            if (group && previous != undefined && hours === previousHours) {
                previous.weekdays.push(weekday);
                previous.lastDay = name;
                previous.schemaDays.push(schemaDay);
            }
            else {
                rows.push({
                    weekdays: [weekday],
                    firstDay: name,
                    lastDay: undefined,
                    ranges: ranges.map(range => this.toShownRange(range, times)),
                    note: day?.note,
                    schemaDays: [schemaDay]
                });
            }
            previousHours = hours;
        }
        return rows;
    }

    /**
     * Whether a business is open at a moment of the week. A range that closes at or before it opens ends on the next
     * day, so it is open after midnight of the day after as well.
     * @param week - The opening hours of the days.
     * @param moment - The day and the time, in the time zone of the business.
     * @returns Whether one of the ranges is open at the moment.
     */
    static isOpen(week: OpeningHoursDay[], moment: OpeningHoursMoment): boolean {
        const yesterday: InputWeekday = WEEK[(moment.weekday + WEEK.length - 1) % WEEK.length];
        const openToday: boolean = (this.findDay(week, moment.weekday)?.ranges ?? []).some(range => {
            const opens: number = this.toMinutes(range.opens);
            const closes: number = this.toMinutes(range.closes);
            return opens <= moment.minutes && (closes <= opens || moment.minutes < closes);
        });
        const openSinceYesterday: boolean = (this.findDay(week, yesterday)?.ranges ?? []).some(range => {
            const closes: number = this.toMinutes(range.closes);
            return closes <= this.toMinutes(range.opens) && moment.minutes < closes;
        });
        return openToday || openSinceYesterday;
    }

    /**
     * Resolves the day of the week and the time of a date in a time zone.
     * @param date - The date, like now.
     * @param timeZone - The time zone, like 'Europe/Berlin', or undefined for the one of the browser.
     * @returns The day and the minutes since midnight there.
     */
    static resolveMoment(date: Date, timeZone: string | undefined): OpeningHoursMoment {
        const parts: Intl.DateTimeFormatPart[] = new Intl.DateTimeFormat('en-US', {
            timeZone,
            weekday: 'short',
            hour: 'numeric',
            minute: 'numeric',
            hourCycle: 'h23'
        }).formatToParts(date);
        const findPart: (type: Intl.DateTimeFormatPartTypes) => string = type => parts.find(part => part.type === type)?.value ?? '';
        return {
            weekday: EN_US_WEEKDAYS[findPart('weekday')] ?? WEEK[date.getDay()],
            minutes: (Number(findPart('hour')) * MINUTES_PER_HOUR) + Number(findPart('minute'))
        };
    }

    private static resolveWeekdays(firstDayOfWeek: InputWeekday): InputWeekday[] {
        return WEEK.map(offset => WEEK[(firstDayOfWeek + offset) % WEEK.length]);
    }

    private static findDay(week: OpeningHoursDay[], weekday: InputWeekday): OpeningHoursDay | undefined {
        return week.find(day => day.weekday === weekday);
    }

    private static resolveDate(weekday: InputWeekday): Date {
        return new Date(A_SUNDAY.getFullYear(), A_SUNDAY.getMonth(), A_SUNDAY.getDate() + weekday);
    }

    private static toShownRange(range: OpeningHoursRange, times: Intl.DateTimeFormat): OpeningHoursShownRange {
        return { ...range, opensText: this.formatTime(range.opens, times), closesText: this.formatTime(range.closes, times) };
    }

    private static formatTime(time: string, times: Intl.DateTimeFormat): string {
        const minutes: number = this.toMinutes(time);
        return times.format(new Date(2024, 0, 1, Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR));
    }

    private static toMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return (hours * MINUTES_PER_HOUR) + minutes;
    }
}
import { InputWeekday } from '@service-soft/ui/input';

import { InputDateType } from './input-date-type.type';

const DAYS_PER_WEEK: number = 7;
const CALENDAR_WEEKS: number = 6;
const HOURS_PER_HALF_DAY: number = 12;
const YEAR_DIGITS: number = 4;
const MILLISECONDS_PER_DAY: number = 86_400_000;

/**
 * The parts of a date that are typed as numbers.
 */
type DateNumberPart = 'year' | 'month' | 'day' | 'hour' | 'minute';

const DATE_NUMBER_PARTS: readonly string[] = ['year', 'month', 'day', 'hour', 'minute'] satisfies DateNumberPart[];

/**
 * Converts between a Date, the text of a date input in the language of the app and the value of a native date input,
 * in the time zone of the browser.
 */
export abstract class InputDateUtilities {
    /**
     * Gets the value a native date input shows for a date. Values of the same type sort like their dates.
     * @param date - The date, or undefined for none.
     * @param type - The type of the input, which says whether it shows the time.
     * @returns The value, like '2026-11-12' or '2026-11-12T09:30', or '' for none.
     */
    // by the local parts of the date: toISOString would write the day in UTC, which is the day before for a user east
    // of it at midnight.
    static getNativeValue(date: Date | undefined, type: InputDateType): string {
        if (date == undefined || Number.isNaN(date.getTime())) {
            return '';
        }
        const day: string = `${this.pad(date.getFullYear(), YEAR_DIGITS)}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
        return type === 'date' ? day : `${day}T${this.pad(date.getHours())}:${this.pad(date.getMinutes())}`;
    }

    /**
     * Resolves the format a date input shows its date in: the order and separators of the language, with two digits
     * for day and month, so every date has the same length.
     * @param locale - The language, like 'en-US' or 'de'.
     * @param type - The type of the input, which says whether it shows the time.
     * @returns The format, like '11/12/2026, 09:30 AM' in 'en-US' or '12.11.2026, 09:30' in 'de'.
     */
    // latn digits: some languages write their own digits, which nobody types on a keyboard and findDateInText reads.
    static resolveFormat(locale: string, type: InputDateType): Intl.DateTimeFormat {
        const time: Intl.DateTimeFormatOptions = type === 'datetime-local' ? { hour: '2-digit', minute: '2-digit' } : {};
        return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', numberingSystem: 'latn', ...time });
    }

    /**
     * Finds the date in a text typed in a format, which may leave out the leading zeros and use other separators, like
     * '1/2/2026' for '01/02/2026'. In a language with a 12-hour clock, a time without AM or PM is read as 24-hour.
     * @param text - The text.
     * @param format - The format, from resolveFormat.
     * @returns The date, or undefined when the text holds no complete and existing date, like '02/30/2026'.
     */
    // the numbers in the order of the format, rather than a pattern of it: that also reads what a user types with other
    // separators or spaces, and works the same for every language.
    static findDateInText(text: string, format: Intl.DateTimeFormat): Date | undefined {
        const order: string[] = format.formatToParts(new Date()).map(part => part.type)
            .filter(type => DATE_NUMBER_PARTS.includes(type));
        const numbers: string[] = text.match(/\d+/g) ?? [];
        if (numbers.length !== order.length || (numbers[order.indexOf('year')]?.length ?? 0) < YEAR_DIGITS) {
            return undefined;
        }
        const parts: Map<string, number> = new Map(order.map((type, index) => [type, Number(numbers[index])]));
        const year: number = parts.get('year') ?? 0;
        const month: number = (parts.get('month') ?? 0) - 1;
        const day: number = parts.get('day') ?? 0;
        const hours: number = this.resolveHours(parts.get('hour') ?? 0, text, format);
        const minutes: number = parts.get('minute') ?? 0;
        const date: Date = new Date(year, month, day, hours, minutes);
        // the Date moves a day, month or time that doesn't exist into the next one, so it only is the date typed when
        // every part stayed what was typed
        const isTyped: boolean = date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
            && date.getHours() === hours && date.getMinutes() === minutes;
        return isTyped ? date : undefined;
    }

    /**
     * Resolves the first day of the month of a date.
     * @param date - Any moment of the month.
     * @returns Midnight of its first day, in the time zone of the browser.
     */
    static resolveMonthStart(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    /**
     * Resolves the start of the day of a date, or of a day before or after it.
     * @param date - Any moment of the day.
     * @param offset - How many days later, or earlier when negative.
     * @returns Midnight of the day, in the time zone of the browser.
     */
    // by the local parts of the date, like resolveCalendarWeeks, so a day stays a day when the clocks change.
    static resolveDayStart(date: Date, offset: number = 0): Date {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
    }

    /**
     * Resolves how many days one date is after another, by their days: from the 12th to the 15th are 3 days, whatever
     * the time.
     * @param start - The earlier date.
     * @param end - The later date.
     * @returns The number of days, negative when the end is before the start.
     */
    // by the days in UTC, which has no changes of the clock: a local day can have 23 or 25 hours.
    static resolveDaysBetween(start: Date, end: Date): number {
        const startDay: number = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
        const endDay: number = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
        return Math.round((endDay - startDay) / MILLISECONDS_PER_DAY);
    }

    /**
     * Resolves the days a calendar shows for a month: six whole weeks, from the week of its first day on, so the
     * calendar keeps its height from month to month. The days before and after the month fill the first and the last
     * weeks.
     * @param month - Any moment of the month.
     * @param firstDayOfWeek - The day every week starts with.
     * @returns The weeks, each with its seven days at midnight in the time zone of the browser.
     */
    // by the local parts of the date, not by adding a day in milliseconds, which skips or repeats a day when the
    // clocks change.
    static resolveCalendarWeeks(month: Date, firstDayOfWeek: InputWeekday): Date[][] {
        const start: Date = this.resolveMonthStart(month);
        const daysBefore: number = (start.getDay() - firstDayOfWeek + DAYS_PER_WEEK) % DAYS_PER_WEEK;
        return Array.from({ length: CALENDAR_WEEKS }, (_, week) => Array.from({ length: DAYS_PER_WEEK }, (_, weekday) => {
            return new Date(start.getFullYear(), start.getMonth(), 1 - daysBefore + (week * DAYS_PER_WEEK) + weekday);
        }));
    }

    /**
     * Whether two dates are on the same day, in the time zone of the browser.
     * @param date - The one date, or undefined for none.
     * @param other - The other date.
     * @returns Whether both are on the same day.
     */
    static isSameDay(date: Date | undefined, other: Date): boolean {
        return date?.getFullYear() === other.getFullYear()
            && date.getMonth() === other.getMonth()
            && date.getDate() === other.getDate();
    }

    /**
     * Resolves the hour of the day a typed hour means: in a language with a 12-hour clock, with the AM or PM the text
     * holds, and as 24-hour without them.
     * @param hour - The typed hour.
     * @param text - The whole typed text, which may hold AM or PM.
     * @param format - The format the text is typed in, which says the clock and how the language writes AM and PM.
     * @returns The hour, from 0 to 23 for an hour that exists.
     */
    // AM and PM as the language writes them, like 'PM' or 'p.m.', read from the format itself.
    static resolveHours(hour: number, text: string, format: Intl.DateTimeFormat): number {
        const hourCycle: string | undefined = format.resolvedOptions().hourCycle;
        if (hourCycle !== 'h11' && hourCycle !== 'h12') {
            return hour;
        }
        const typed: string = text.toLowerCase();
        if (this.isDayPeriodTyped(typed, format, HOURS_PER_HALF_DAY + 1)) {
            return (hour % HOURS_PER_HALF_DAY) + HOURS_PER_HALF_DAY;
        }
        return this.isDayPeriodTyped(typed, format, 1) ? hour % HOURS_PER_HALF_DAY : hour;
    }

    private static isDayPeriodTyped(typed: string, format: Intl.DateTimeFormat, hour: number): boolean {
        const period: string | undefined = format.formatToParts(new Date(2026, 0, 1, hour)).find(part => part.type === 'dayPeriod')?.value;
        return period != undefined && typed.includes(period.toLowerCase());
    }

    private static pad(value: number, length: number = 2): string {
        return String(value).padStart(length, '0');
    }
}
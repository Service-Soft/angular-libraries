import { DatePeriodDate } from './date-period-date.type';
import { DatePeriodEnd } from './date-period-end.type';
import { DatePeriodFormat } from './date-period-format.type';
import { DatePeriodPart } from './date-period-part.model';

// a date without a time, like '2022-02' or '2022-02-14'. new Date() reads those as midnight in UTC, which is the day
// before in every timezone west of it, so February would show as January there.
const DATE_ONLY: RegExp = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;

/**
 * Utilities for periods of dates, like '02/2022 – today', as the date period pipe and component write them.
 */
export abstract class DatePeriodUtilities {
    /**
     * Resolves the start and the end of a period as they show. A period whose start and end show the same, like two
     * days of one month in a format of months, shows as a single date.
     * @param start - When it started.
     * @param end - When it ended, 'open' for a period that is still going on, or undefined for a single date.
     * @param format - How the dates are written.
     * @param locale - The language they are written in, like 'de'.
     * @param openEndLabel - What shows as the end of a period that is still going on, like 'today'.
     * @returns The start, and the end unless it is a single date.
     */
    static resolveParts(
        start: DatePeriodDate,
        end: DatePeriodEnd,
        format: DatePeriodFormat,
        locale: string,
        openEndLabel: string
    ): DatePeriodPart[] {
        const startPart: DatePeriodPart = this.resolvePart(this.resolveDate(start), format, locale);
        if (end == undefined) {
            return [startPart];
        }
        if (end === 'open') {
            return [startPart, { text: openEndLabel, dateTime: undefined }];
        }
        const endPart: DatePeriodPart = this.resolvePart(this.resolveDate(end), format, locale);
        return endPart.text === startPart.text ? [startPart] : [startPart, endPart];
    }

    /**
     * Resolves the Date of a date of a period. A string without a time, like '2022-02' or '2022-02-14', is a day of the
     * local calendar, the first of the month without a day.
     * @param value - The date, a timestamp or a string.
     * @returns The date.
     */
    static resolveDate(value: DatePeriodDate): Date {
        if (value instanceof Date) {
            return value;
        }
        const dateOnly: RegExpExecArray | null | undefined = typeof value === 'string' ? DATE_ONLY.exec(value) : undefined;
        if (dateOnly == undefined) {
            return new Date(value);
        }
        const [, year, month, day] = dateOnly;
        return new Date(Number(year), Number(month) - 1, Number(day ?? 1));
    }

    private static resolvePart(date: Date, format: DatePeriodFormat, locale: string): DatePeriodPart {
        const text: string = typeof format === 'function' ? format(date, locale) : new Intl.DateTimeFormat(locale, format).format(date);
        return { text, dateTime: this.resolveDateTime(date) };
    }

    // the day in the local calendar, which is what the text shows as well. A valid date string of the datetime
    // attribute whatever the format, which may leave out the day or add a time.
    private static resolveDateTime(date: Date): string {
        const month: string = String(date.getMonth() + 1).padStart(2, '0');
        const day: string = String(date.getDate()).padStart(2, '0');
        return `${String(date.getFullYear()).padStart(4, '0')}-${month}-${day}`;
    }
}
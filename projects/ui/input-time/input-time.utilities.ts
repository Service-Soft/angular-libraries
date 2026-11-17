import { InputDateUtilities } from '@service-soft/ui/input-date';

const MINUTES_PER_HOUR: number = 60;
const HOURS_PER_DAY: number = 24;

/**
 * Converts between a time as 'HH:mm', like the value of a native time input, and its text in the language of the app.
 */
export abstract class InputTimeUtilities {
    /**
     * Resolves the times from one to another in steps, like every half hour of opening hours from '08:00' to '18:00'.
     * @param from - The first time, as 'HH:mm'.
     * @param until - The last time, as 'HH:mm', which is one of them when the steps reach it.
     * @param stepMinutes - How many minutes are between two times.
     * @returns The times, as 'HH:mm', like ['08:00', '08:30', …, '18:00'].
     */
    static resolveTimes(from: string, until: string, stepMinutes: number): string[] {
        const first: number = this.resolveMinutes(from);
        const last: number = this.resolveMinutes(until);
        const count: number = stepMinutes > 0 && last >= first ? Math.floor((last - first) / stepMinutes) + 1 : 0;
        return Array.from({ length: count }, (_, index) => this.formatMinutes(first + (index * stepMinutes)));
    }

    /**
     * Resolves the format every time of a time input, its picker and the times of a date range are shown in: the clock
     * and separators of the language, the hour as the language writes it.
     * @param locale - The language, like 'en-US' or 'de'.
     * @returns The format, like '9:30 AM' in 'en-US' or '9:30' in 'de'.
     */
    // latn digits, like the format of a date input: some languages write their own digits, which nobody types. The
    // hour as the language writes it rather than with two digits, so the input reads like the list of its picker.
    static resolveFormat(locale: string): Intl.DateTimeFormat {
        return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', numberingSystem: 'latn' });
    }

    /**
     * Finds the time in a text typed in a format, which may leave out the leading zero and the minutes and use another
     * separator, like '9' or '9.30' for '09:30'. In a language with a 12-hour clock, a time without AM or PM is read as
     * 24-hour.
     * @param text - The text.
     * @param format - The format, from resolveFormat.
     * @returns The time, as 'HH:mm', or undefined when the text holds no time that exists, like '25:00'.
     */
    static findTimeInText(text: string, format: Intl.DateTimeFormat): string | undefined {
        const numbers: number[] = (text.match(/\d+/g) ?? []).map(Number);
        const [hour, minutes = 0] = numbers;
        if (hour == undefined || numbers.length > 2) {
            return undefined;
        }
        const hours: number = InputDateUtilities.resolveHours(hour, text, format);
        return hours < HOURS_PER_DAY && minutes < MINUTES_PER_HOUR ? this.formatMinutes((hours * MINUTES_PER_HOUR) + minutes) : undefined;
    }

    /**
     * Resolves the text of a time in a format.
     * @param time - The time, as 'HH:mm'.
     * @param format - The format, from resolveFormat or any other of times.
     * @returns The text, like '9:30 AM'.
     */
    static resolveText(time: string, format: Intl.DateTimeFormat): string {
        const minutes: number = this.resolveMinutes(time);
        return format.format(new Date(2026, 0, 1, Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR));
    }

    /**
     * Gets the time of a date, like the value of a native time input.
     * @param date - The date.
     * @returns The time, as 'HH:mm'.
     */
    static getTime(date: Date): string {
        return this.formatMinutes((date.getHours() * MINUTES_PER_HOUR) + date.getMinutes());
    }

    /**
     * Resolves how many minutes after midnight a time is.
     * @param time - The time, as 'HH:mm'.
     * @returns The minutes, like 570 for '09:30'.
     */
    // a time is always 'HH:mm', which has both numbers.
    static resolveMinutes(time: string): number {
        const [hours = 0, minutes = 0] = time.split(':').map(Number);
        return (hours * MINUTES_PER_HOUR) + minutes;
    }

    private static formatMinutes(minutes: number): string {
        const hours: string = String(Math.floor(minutes / MINUTES_PER_HOUR)).padStart(2, '0');
        return `${hours}:${String(minutes % MINUTES_PER_HOUR).padStart(2, '0')}`;
    }
}
import { formatDate } from '@angular/common';

// only full ISO dates, like the api sends them. Anything new Date() accepts would include strings like '1' or 'May'.
const ISO_DATE: RegExp = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

/**
 * Formats the values of changes for reading.
 */
export abstract class ChangeValueUtilities {
    /**
     * Formats a changed value as text: dates in the given format, lists of simple values on one line, objects as
     * indented json, and a dash for no value.
     * @param value - The previous or new value of a change.
     * @param dateFormat - The format of dates, in the format of Angular's DatePipe.
     * @param locale - The locale dates are formatted in.
     * @returns The text to show.
     */
    static format(value: unknown, dateFormat: string, locale: string): string {
        if (value == undefined) {
            return '-';
        }
        if (value instanceof Date || (typeof value === 'string' && ISO_DATE.test(value))) {
            return formatDate(value, dateFormat, locale);
        }
        if (Array.isArray(value) && value.every(item => !this.isObject(item))) {
            return `[${value.map(item => JSON.stringify(item)).join(', ')}]`;
        }
        // values come from the api as json, so everything that isn't a string is a number, a boolean or an object.
        return typeof value === 'string' ? value : JSON.stringify(value, undefined, 2);
    }

    private static isObject(value: unknown): boolean {
        return typeof value === 'object' && value != undefined;
    }
}
import { InputWeekday } from '@service-soft/ui/input';
import { InputDateUtilities } from '@service-soft/ui/input-date';

import { EventCalendarEvent } from './event-calendar-event.model';
import { EventCalendarRange } from './event-calendar-range.model';
import { EventCalendarView } from './event-calendar-view.type';

// the characters a text value of an iCalendar file escapes with a backslash, see RFC 5545, 3.3.11.
const CALENDAR_FILE_SPECIAL_CHARACTERS: RegExp = /[\\;,]/g;
const CALENDAR_FILE_LINE_BREAK: string = '\r\n';

/**
 * Finds the events of a day and the days an event calendar shows, and writes an event as an iCalendar file, in the time
 * zone of the browser.
 */
export abstract class EventCalendarUtilities {
    /**
     * Finds the events that take place on a day, all of it or a part, in the order a calendar lists them: the ones that
     * last all day first, then by their start and their title.
     * @param events - The events.
     * @param day - Any moment of the day.
     * @returns The events of the day.
     */
    static findEventsOfDay(events: readonly EventCalendarEvent[], day: Date): EventCalendarEvent[] {
        // filter returns a new array, so sorting it leaves the events of the consumer as they are.
        return events.filter(event => this.isOnDay(event, day))
            .sort((a, b) => Number(b.allDay ?? false) - Number(a.allDay ?? false)
                || a.start.getTime() - b.start.getTime()
                || a.title.localeCompare(b.title));
    }

    /**
     * Whether an event takes place on a day, all of it or a part. An event that ends at midnight doesn't take place on
     * the day that starts then.
     * @param event - The event.
     * @param day - Any moment of the day.
     * @returns Whether it does.
     */
    static isOnDay(event: EventCalendarEvent, day: Date): boolean {
        const dayStart: Date = InputDateUtilities.resolveDayStart(day);
        const end: Date = event.end ?? event.start;
        return event.allDay === true
            ? InputDateUtilities.resolveDayStart(event.start) <= dayStart && dayStart <= InputDateUtilities.resolveDayStart(end)
            : this.isMomentOnDay(event.start, end, dayStart);
    }

    /**
     * Resolves the days an event calendar shows: the six weeks around a month, or the month in the list.
     * @param month - Any moment of the month.
     * @param view - How the calendar shows its events.
     * @param firstDayOfWeek - The day the weeks start with.
     * @returns The days, from midnight of the first to midnight after the last.
     */
    static resolveRange(month: Date, view: EventCalendarView, firstDayOfWeek: InputWeekday): EventCalendarRange {
        const monthStart: Date = InputDateUtilities.resolveMonthStart(month);
        if (view === 'agenda') {
            return { start: monthStart, end: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1) };
        }
        const days: Date[] = InputDateUtilities.resolveCalendarWeeks(monthStart, firstDayOfWeek).flat();
        const first: Date = days.at(0) ?? monthStart;
        const last: Date = days.at(-1) ?? monthStart;
        return { start: first, end: InputDateUtilities.resolveDayStart(last, 1) };
    }

    /**
     * Gets what identifies an event: its id, or its title and start.
     * @param event - The event.
     * @returns The key.
     */
    static getKey(event: EventCalendarEvent): string {
        return event.id ?? `${event.title}@${event.start.getTime()}`;
    }

    /**
     * Resolves an event as an iCalendar file, which calendar apps import, like the one of the phone. An event that lasts
     * all day is one of whole days, every other one is written in UTC, so it shows at the same moment everywhere.
     * @param event - The event.
     * @param now - When the file is created.
     * @returns The content of the .ics file.
     */
    static resolveCalendarFile(event: EventCalendarEvent, now: Date): string {
        const end: Date = event.end ?? event.start;
        // the end of an event of whole days is the day after its last one, see RFC 5545, 3.6.1.
        const times: string[] = event.allDay === true
            ? [
                `DTSTART;VALUE=DATE:${this.formatCalendarFileDay(event.start)}`,
                `DTEND;VALUE=DATE:${this.formatCalendarFileDay(InputDateUtilities.resolveDayStart(end, 1))}`
            ]
            : [`DTSTART:${this.formatCalendarFileMoment(event.start)}`, `DTEND:${this.formatCalendarFileMoment(end)}`];
        const optional: string[] = [
            event.location == undefined ? '' : `LOCATION:${this.escapeCalendarFileText(event.location)}`,
            event.description == undefined ? '' : `DESCRIPTION:${this.escapeCalendarFileText(event.description)}`,
            event.url == undefined ? '' : `URL:${event.url}`
        ].filter(line => line !== '');
        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Service-Soft//ui event calendar//EN',
            'BEGIN:VEVENT',
            `UID:${this.escapeCalendarFileText(this.getKey(event))}`,
            `DTSTAMP:${this.formatCalendarFileMoment(now)}`,
            ...times,
            `SUMMARY:${this.escapeCalendarFileText(event.title)}`,
            ...optional,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join(CALENDAR_FILE_LINE_BREAK);
    }

    /**
     * Resolves the address of a link that downloads an event as an iCalendar file, which works without a server and
     * when the page is rendered on one.
     * @param event - The event.
     * @param now - When the file is created.
     * @returns A data url of the file.
     */
    static resolveCalendarFileUrl(event: EventCalendarEvent, now: Date): string {
        return `data:text/calendar;charset=utf-8,${encodeURIComponent(this.resolveCalendarFile(event, now))}`;
    }

    // an event without a duration is on the day it happens.
    private static isMomentOnDay(start: Date, end: Date, dayStart: Date): boolean {
        return start < InputDateUtilities.resolveDayStart(dayStart, 1)
            && (end > dayStart || (end.getTime() === start.getTime() && start >= dayStart));
    }

    private static escapeCalendarFileText(text: string): string {
        return text.replaceAll(CALENDAR_FILE_SPECIAL_CHARACTERS, character => `\\${character}`).replaceAll(/\r?\n/g, String.raw`\n`);
    }

    // like 20261112, by the local day.
    private static formatCalendarFileDay(date: Date): string {
        return InputDateUtilities.getNativeValue(date, 'date').replaceAll('-', '');
    }

    // like 20261112T083000Z, in UTC.
    private static formatCalendarFileMoment(date: Date): string {
        const [seconds = ''] = date.toISOString().replaceAll(/[-:]/g, '')
            .split('.');
        return `${seconds}Z`;
    }
}
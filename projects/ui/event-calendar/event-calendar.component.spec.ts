import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { provideEventCalendarConfig } from './event-calendar-config.provider';
import { EventCalendarEvent } from './event-calendar-event.model';
import { EventCalendarRange } from './event-calendar-range.model';
import { EventCalendarView } from './event-calendar-view.type';
import { EventCalendarComponent } from './event-calendar.component';
import { EventCalendarUtilities } from './event-calendar.utilities';

// the 12th of November 2026 is a Thursday, the 1st a Sunday.
const EVENTS: EventCalendarEvent[] = [
    {
        title: 'Training',
        start: new Date(2026, 10, 12, 18, 0),
        end: new Date(2026, 10, 12, 19, 30),
        category: { label: 'Youth', color: 'success' },
        location: 'Sports hall',
        description: 'Bring indoor shoes.\nWater is there.',
        url: 'https://example.com/training'
    },
    { title: 'Match', start: new Date(2026, 10, 12, 15, 0), end: new Date(2026, 10, 12, 17, 0), category: { label: 'First team', color: 'error' } },
    { title: 'Board meeting', start: new Date(2026, 10, 12, 20, 0), end: new Date(2026, 10, 12, 21, 0) },
    { title: 'Tournament', start: new Date(2026, 10, 20), end: new Date(2026, 10, 22), allDay: true },
    { title: 'Party', start: new Date(2026, 10, 14, 20, 0), end: new Date(2026, 10, 15, 0, 0) }
];

@Component({
    selector: 'ui-event-calendar-host',
    template: '<ui-event-calendar [events]="events()" [(month)]="month" [(view)]="view" (rangeChange)="ranges.push($event)" />',
    imports: [EventCalendarComponent]
})
class EventCalendarHostComponent {
    readonly events: WritableSignal<EventCalendarEvent[]> = signal(EVENTS);
    readonly month: WritableSignal<Date> = signal(new Date(2026, 10, 1));
    readonly view: WritableSignal<EventCalendarView> = signal('month');
    readonly ranges: EventCalendarRange[] = [];
}

async function render(): Promise<[ComponentFixture<EventCalendarHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<EventCalendarHostComponent> = TestBed.createComponent(EventCalendarHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// what screen readers read as the name of a cell: its content that isn't hidden from them
function findName(cell: HTMLElement): string {
    return Array.from(cell.querySelectorAll('ui-event-calendar-cell > :not([aria-hidden="true"])'), getText).join(' ');
}

function findDay(root: HTMLElement, date: string): HTMLElement {
    const day: HTMLElement | undefined = Array.from(root.querySelectorAll<HTMLElement>('[role="gridcell"]'))
        .find(cell => findName(cell).startsWith(`${date},`));
    if (day == undefined) {
        throw new Error(`The month shows no ${date}.`);
    }
    return day;
}

function findButton(root: HTMLElement, name: string): HTMLButtonElement {
    const button: HTMLButtonElement | undefined = Array.from(root.querySelectorAll('button'))
        .find(candidate => (candidate.getAttribute('aria-label') ?? candidate.textContent).trim() === name);
    if (button == undefined) {
        throw new Error(`The calendar shows no button ${name}.`);
    }
    return button;
}

function getText(element: Element | null | undefined): string {
    return element?.textContent?.replaceAll(/\s+/g, ' ').trim() ?? '';
}

// the details of the events below the month, or of a day of the list
function findTitles(root: Element): string[] {
    return Array.from(root.querySelectorAll('ui-event-calendar-event'), event => getText(event.querySelector('p')));
}

async function click(fixture: ComponentFixture<unknown>, element: HTMLElement): Promise<void> {
    element.click();
    await fixture.whenStable();
}

describe('EventCalendarComponent', () => {
    beforeEach(() => {
        // only the clock, so today is the same day in every run, and Angular's own timers keep working
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 10, 5, 12, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('shows the weeks of the month in a grid named by the month, each day with its events', async () => {
        const [, root] = await render();
        const grid: HTMLElement | null = root.querySelector('[role="grid"]');
        expect(getText(root.querySelector(`#${grid?.getAttribute('aria-labelledby') ?? ''}`))).toBe('November 2026');
        expect(Array.from(root.querySelectorAll('th .sr-only'), getText)).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
        expect(root.querySelectorAll('[role="gridcell"]')).toHaveLength(42);

        const busyDay: HTMLElement = findDay(root, 'Thursday, November 12, 2026');
        // named by its content, not an aria-label that would leave out the visible times
        expect(busyDay.hasAttribute('aria-label')).toBe(false);
        expect(findName(busyDay)).toBe('Thursday, November 12, 2026, 3 events: Match, Training, Board meeting');
        // two titles, the time of their start, and how many more there are
        expect(Array.from(busyDay.querySelectorAll('li'), getText)).toEqual(['3:00 PM Match', '6:00 PM Training', '+1 more']);
        expect(busyDay.querySelector('li')?.classList.contains('bg-error')).toBe(true);
        expect(busyDay.querySelector('li')?.classList.contains('w-full')).toBe(true);
        // the header strip and the circles of the days of the calendar of a date input
        expect(root.querySelector('[aria-live]')?.parentElement?.parentElement?.classList.contains('surface-primary')).toBe(true);
        expect(findDay(root, 'Thursday, November 5, 2026').querySelector('span[aria-hidden]')?.className).toContain('bg-primary');
        expect(busyDay.querySelector('span[aria-hidden]')?.className).toContain('rounded-full');
        expect(busyDay.querySelector('ul')?.getAttribute('aria-hidden')).toBe('true');
        expect(findName(findDay(root, 'Monday, November 2, 2026'))).toBe('Monday, November 2, 2026, no events');
        expect(findDay(root, 'Thursday, November 5, 2026').getAttribute('aria-current')).toBe('date');
    });

    test('shows an event of several days on each of them, and one that ends at midnight only before it', async () => {
        const [, root] = await render();

        for (const date of ['Friday, November 20, 2026', 'Saturday, November 21, 2026', 'Sunday, November 22, 2026']) {
            expect(findName(findDay(root, date))).toBe(`${date}, 1 event: Tournament`);
        }
        expect(findName(findDay(root, 'Monday, November 23, 2026'))).toContain('no events');
        expect(findName(findDay(root, 'Saturday, November 14, 2026'))).toContain('Party');
        expect(findName(findDay(root, 'Sunday, November 15, 2026'))).toContain('no events');
    });

    test('shows the events of today below the month, and of the day that is clicked', async () => {
        const [fixture, root] = await render();
        const today: HTMLElement = findDay(root, 'Thursday, November 5, 2026');
        expect(today.getAttribute('aria-selected')).toBe('true');
        expect(getText(root.querySelector('table + div time'))).toBe('Thursday, November 5, 2026');
        expect(getText(root.querySelector('table + div ui-event-calendar-event-list > p'))).toBe('No events on this day.');

        await click(fixture, findDay(root, 'Thursday, November 12, 2026'));
        expect(findDay(root, 'Thursday, November 12, 2026').getAttribute('aria-selected')).toBe('true');
        expect(today.getAttribute('aria-selected')).toBe('false');
        expect(root.querySelector('table + div time')?.getAttribute('datetime')).toBe('2026-11-12');
        expect(findTitles(root)).toEqual(['Match', 'Training', 'Board meeting']);
    });

    test('moves through the days with the arrow keys and shows the events of the day it is on', async () => {
        const [fixture, root] = await render();
        const today: HTMLElement = findDay(root, 'Thursday, November 5, 2026');
        // the selected day is the one the tab key reaches
        expect(today.tabIndex).toBe(0);

        today.focus();
        today.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await fixture.whenStable();
        const next: HTMLElement = findDay(root, 'Thursday, November 12, 2026');
        expect(document.activeElement).toBe(next);
        expect(next.getAttribute('aria-selected')).toBe('true');
        expect(findTitles(root)).toEqual(['Match', 'Training', 'Board meeting']);
    });

    test('shows the details of an event: its times, category, location, description and links', async () => {
        const [fixture, root] = await render();
        await click(fixture, findDay(root, 'Thursday, November 12, 2026'));
        const training: Element | undefined = root.querySelectorAll('ui-event-calendar-event')[1];

        expect(Array.from(training?.querySelectorAll('time') ?? [], time => [time.getAttribute('datetime'), getText(time)]))
            .toEqual([['2026-11-12T18:00', '6:00 PM'], ['2026-11-12T19:30', '7:30 PM']]);
        expect(training?.querySelector('[aria-hidden="true"]')?.classList.contains('bg-success')).toBe(true);
        expect(getText(training?.querySelector('span.text-on-success'))).toBe('Youth');
        expect(getText(training?.querySelector('ui-icon + span'))).toBe('Location: Sports hall');
        expect(training?.querySelector('.whitespace-pre-line')?.textContent).toBe('Bring indoor shoes.\nWater is there.');
        const [details, file] = Array.from(training?.querySelectorAll('a') ?? []);
        expect(details?.getAttribute('href')).toBe('https://example.com/training');
        expect(getText(details)).toBe('Details: Training');
        expect(getText(file)).toBe('Add to calendar: Training');
        expect(file?.getAttribute('download')).toBe('training.ics');
        expect(decodeURIComponent(file?.getAttribute('href') ?? '')).toContain('SUMMARY:Training');
    });

    test('writes the days of an event of whole days, and the date of a time on another day', async () => {
        const [fixture, root] = await render();
        await click(fixture, findDay(root, 'Saturday, November 21, 2026'));
        expect(getText(root.querySelector('ui-event-calendar-event p + p'))).toBe('Nov 20, 2026 – Nov 22, 2026');

        await click(fixture, findDay(root, 'Saturday, November 14, 2026'));
        expect(getText(root.querySelector('ui-event-calendar-event p + p'))).toBe('8:00 PM – Nov 15, 2026, 12:00 AM');

        fixture.componentInstance.events.set([{ title: 'Holiday', start: new Date(2026, 10, 14), allDay: true }]);
        await fixture.whenStable();
        expect(getText(root.querySelector('ui-event-calendar-event p + p'))).toBe('All day');
    });

    test('switches to the months before and after and back to today, and emits the days it shows', async () => {
        const [fixture, root] = await render();
        const label: Element | null = root.querySelector('[aria-live]');
        expect(fixture.componentInstance.ranges).toEqual([{ start: new Date(2026, 9, 26), end: new Date(2026, 11, 7) }]);

        await click(fixture, findButton(root, 'Next month'));
        expect(getText(label)).toBe('December 2026');
        expect(fixture.componentInstance.month()).toEqual(new Date(2026, 11, 1));
        expect(fixture.componentInstance.ranges.at(-1)).toEqual({ start: new Date(2026, 10, 30), end: new Date(2027, 0, 11) });
        // another month starts at its first day
        expect(getText(root.querySelector('table + div time'))).toBe('Tuesday, December 1, 2026');

        await click(fixture, findButton(root, 'Previous month'));
        await click(fixture, findButton(root, 'Previous month'));
        expect(getText(label)).toBe('October 2026');

        await click(fixture, findButton(root, 'Today'));
        expect(getText(label)).toBe('November 2026');
        expect(getText(root.querySelector('table + div time'))).toBe('Thursday, November 5, 2026');
        // November, December, November, October and November again
        expect(fixture.componentInstance.ranges).toHaveLength(5);
    });

    test('lists the days of the month with events, and says when it has none', async () => {
        const [fixture, root] = await render();
        const list: HTMLButtonElement = findButton(root, 'List');
        expect(list.getAttribute('aria-pressed')).toBe('false');
        expect(root.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('View');

        await click(fixture, list);
        expect(fixture.componentInstance.view()).toBe('agenda');
        expect(list.getAttribute('aria-pressed')).toBe('true');
        expect(root.querySelector('[role="grid"]')).toBeNull();
        expect(fixture.componentInstance.ranges.at(-1)).toEqual({ start: new Date(2026, 10, 1), end: new Date(2026, 11, 1) });
        const days: HTMLElement[] = Array.from(root.querySelectorAll('ol > li'));
        expect(days.map(day => day.querySelector('time')?.getAttribute('datetime')))
            .toEqual(['2026-11-12', '2026-11-14', '2026-11-20', '2026-11-21', '2026-11-22']);
        expect(getText(days[0]?.querySelector('time'))).toBe('Thursday, November 12, 2026');
        expect(findTitles(days[0] ?? root)).toEqual(['Match', 'Training', 'Board meeting']);

        await click(fixture, findButton(root, 'Next month'));
        expect(root.querySelector('ol')).toBeNull();
        expect(getText(root.querySelector('ui-event-calendar-agenda > p'))).toBe('No events this month.');
    });

    test('starts the weeks and says its texts like the config says', async () => {
        const moreEventsLabel: (count: number) => string = count => `${count} weitere`;
        TestBed.configureTestingModule({
            providers: [provideEventCalendarConfig({ firstDayOfWeek: 0, maxEventsPerDay: 1, headerColor: 'secondary', moreEventsLabel })]
        });
        const [, root] = await render();
        expect(root.querySelector('[aria-live]')?.parentElement?.parentElement?.classList.contains('surface-secondary')).toBe(true);
        expect(getText(root.querySelector('th .sr-only'))).toBe('Sunday');
        expect(Array.from(findDay(root, 'Thursday, November 12, 2026').querySelectorAll('li'), getText)).toEqual(['3:00 PM Match', '2 weitere']);
    });
});

describe('EventCalendarUtilities', () => {
    test('finds the events of a day, those of whole days first, then by their start', () => {
        const day: Date = new Date(2026, 10, 12);
        const allDay: EventCalendarEvent = { title: 'Open day', start: new Date(2026, 10, 12, 15, 0), allDay: true };
        const moment: EventCalendarEvent = { title: 'Kick-off', start: new Date(2026, 10, 12, 10, 0) };
        const overnight: EventCalendarEvent = { title: 'Night run', start: new Date(2026, 10, 11, 22, 0), end: new Date(2026, 10, 12, 2, 0) };
        expect(EventCalendarUtilities.findEventsOfDay([moment, overnight, allDay], day)).toEqual([allDay, overnight, moment]);
        expect(EventCalendarUtilities.isOnDay(moment, new Date(2026, 10, 13))).toBe(false);
        expect(EventCalendarUtilities.isOnDay({ title: 'Midnight', start: new Date(2026, 10, 13) }, new Date(2026, 10, 13, 12))).toBe(true);
        expect(EventCalendarUtilities.isOnDay({ title: 'Midnight', start: new Date(2026, 10, 13) }, day)).toBe(false);
    });

    test('resolves the six weeks around a month, or the month for the list', () => {
        expect(EventCalendarUtilities.resolveRange(new Date(2026, 10, 12), 'month', 1)).toEqual({ start: new Date(2026, 9, 26), end: new Date(2026, 11, 7) });
        expect(EventCalendarUtilities.resolveRange(new Date(2026, 10, 12), 'month', 0)).toEqual({ start: new Date(2026, 10, 1), end: new Date(2026, 11, 13) });
        expect(EventCalendarUtilities.resolveRange(new Date(2026, 11, 31), 'agenda', 1)).toEqual({ start: new Date(2026, 11, 1), end: new Date(2027, 0, 1) });
    });

    test('writes an event as an iCalendar file, of whole days or in UTC, with its texts escaped', () => {
        const now: Date = new Date(Date.UTC(2026, 10, 5, 12, 0));
        const timed: string = EventCalendarUtilities.resolveCalendarFile({
            id: 'match-1',
            title: 'Match; final, home',
            start: new Date(Date.UTC(2026, 10, 12, 14, 0)),
            end: new Date(Date.UTC(2026, 10, 12, 16, 0)),
            description: 'Line one\nLine two'
        }, now);
        expect(timed.split('\r\n')).toEqual([
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Service-Soft//ui event calendar//EN',
            'BEGIN:VEVENT',
            'UID:match-1',
            'DTSTAMP:20261105T120000Z',
            'DTSTART:20261112T140000Z',
            'DTEND:20261112T160000Z',
            String.raw`SUMMARY:Match\; final\, home`,
            String.raw`DESCRIPTION:Line one\nLine two`,
            'END:VEVENT',
            'END:VCALENDAR'
        ]);

        const allDay: string = EventCalendarUtilities.resolveCalendarFile({ title: 'Tournament', start: new Date(2026, 10, 20), end: new Date(2026, 10, 22), allDay: true }, now);
        expect(allDay).toContain('DTSTART;VALUE=DATE:20261120\r\nDTEND;VALUE=DATE:20261123');
    });
});
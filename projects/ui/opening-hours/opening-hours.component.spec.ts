import { Component, LOCALE_ID, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { provideOpeningHoursConfig } from './opening-hours-config.provider';
import { OpeningHoursDay } from './opening-hours-day.model';
import { OpeningHoursComponent } from './opening-hours.component';
import { OpeningHoursUtilities } from './opening-hours.utilities';

// a practice with split hours from Monday to Thursday, open in the morning on Friday and closed on the weekend.
const SPLIT_HOURS: OpeningHoursDay['ranges'] = [{ opens: '08:00', closes: '12:00' }, { opens: '14:00', closes: '18:00' }];
const WEEK: OpeningHoursDay[] = [
    { weekday: 1, ranges: SPLIT_HOURS },
    { weekday: 2, ranges: SPLIT_HOURS },
    { weekday: 3, ranges: SPLIT_HOURS },
    { weekday: 4, ranges: SPLIT_HOURS },
    { weekday: 5, ranges: [{ opens: '08:00', closes: '13:00' }], note: 'Only by appointment' }
];

@Component({
    selector: 'ui-opening-hours-host',
    template: '<ui-opening-hours timeZone="Europe/Berlin" [week]="week" [group]="group()" />',
    imports: [OpeningHoursComponent]
})
class OpeningHoursHostComponent {
    readonly week: OpeningHoursDay[] = WEEK;

    readonly group: WritableSignal<boolean> = signal(false);
}

async function render(group: boolean = false): Promise<HTMLElement> {
    const fixture: ComponentFixture<OpeningHoursHostComponent> = TestBed.createComponent(OpeningHoursHostComponent);
    fixture.componentInstance.group.set(group);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

// what screen readers read of an element: without what is hidden from them, with the text only they get.
function readAloud(element: Element): string {
    const clone: Element = element.cloneNode(true) as Element;
    clone.querySelectorAll('[aria-hidden="true"]').forEach(hidden => hidden.remove());
    return clone.textContent.replaceAll(/\s+/g, ' ').trim();
}

// the days and the lines of their hours, without the label of today.
function getRows(root: HTMLElement): [string, string][] {
    return [...root.querySelectorAll('tbody tr')].map(row => [
        readAloud(row.querySelector('th > span > span:first-child') ?? row),
        // without a note, its line is empty, and hidden
        [...row.querySelector('td')?.children ?? []]
            .map(line => readAloud(line))
            .filter(line => line !== '')
            .join(' | ')
    ]);
}

describe('OpeningHoursComponent', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test('shows every day of the week from Monday on with its times, closed days and notes, in the language of the app', async () => {
        const root: HTMLElement = await render();

        expect(root.querySelector('caption')?.textContent.trim()).toBe('Opening hours');
        expect(root.querySelectorAll('th[scope="row"]')).toHaveLength(7);
        // Intl separates the time from AM and PM by a narrow no-break space
        expect(getRows(root).map(([day, hours]) => [day, hours.replaceAll(/\s/g, ' ')])).toEqual([
            ['Monday', '8:00 AM to 12:00 PM | 2:00 PM to 6:00 PM'],
            ['Tuesday', '8:00 AM to 12:00 PM | 2:00 PM to 6:00 PM'],
            ['Wednesday', '8:00 AM to 12:00 PM | 2:00 PM to 6:00 PM'],
            ['Thursday', '8:00 AM to 12:00 PM | 2:00 PM to 6:00 PM'],
            ['Friday', '8:00 AM to 1:00 PM | Only by appointment'],
            ['Saturday', 'Closed'],
            ['Sunday', 'Closed']
        ]);
        expect(root.querySelector('time')?.getAttribute('datetime')).toBe('08:00');
    });

    test('groups days after each other with the same hours, and starts the week on the day the app provides', async () => {
        TestBed.configureTestingModule({
            providers: [{ provide: LOCALE_ID, useValue: 'de' }, provideOpeningHoursConfig({ firstDayOfWeek: 0, toLabel: 'bis' })]
        });
        const root: HTMLElement = await render(true);

        expect(getRows(root)).toEqual([
            ['Sonntag', 'Closed'],
            ['Montag bis Donnerstag', '8:00 bis 12:00 | 14:00 bis 18:00'],
            ['Freitag', '8:00 bis 13:00 | Only by appointment'],
            ['Samstag', 'Closed']
        ]);
        // sighted users see a dash instead of the word
        expect(root.querySelector('th [aria-hidden="true"]')?.textContent.trim()).toBe('–');
    });

    test('marks today and says whether it is open now, in the time zone of the business', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        // Monday, 10:00 in Berlin
        vi.setSystemTime(new Date('2026-11-16T09:00:00Z'));
        const root: HTMLElement = await render();

        expect(root.querySelector('p')?.textContent.trim()).toBe('Open now');
        expect(readAloud(root.querySelector('tbody tr th') ?? root)).toBe('Monday Today');
        expect(root.querySelectorAll('th.font-semibold')).toHaveLength(1);

        // Friday, 13:30 in Berlin, after the morning
        vi.setSystemTime(new Date('2026-11-20T12:30:00Z'));
        const afternoon: HTMLElement = await render(true);
        expect(afternoon.querySelector('p')?.textContent.trim()).toBe('Closed now');
        expect(readAloud(afternoon.querySelectorAll('tbody tr th')[1] ?? afternoon)).toBe('Friday Today');
    });

    test('leaves today and the status out on the server, which pages built ahead of time come from', async () => {
        // the flag angular's server rendering sets, under which nothing runs after a render
        const server: { ngServerMode?: boolean } = globalThis;
        server.ngServerMode = true;
        try {
            const root: HTMLElement = await render();

            expect(root.querySelector('p')?.textContent.trim()).toBe('');
            expect(root.textContent).not.toContain('Today');
        }
        finally {
            delete server.ngServerMode;
        }
    });

    test('marks the hours up as schema.org opening hours specifications, one per range for all days of its row', async () => {
        const root: HTMLElement = await render(true);
        const specifications: Element[] = [...root.querySelectorAll('[itemprop="openingHoursSpecification"]')];

        expect(specifications).toHaveLength(3);
        expect(specifications[0]?.getAttribute('itemtype')).toBe('https://schema.org/OpeningHoursSpecification');
        expect([...specifications[0]?.querySelectorAll('meta[itemprop="dayOfWeek"]') ?? []].map(day => day.getAttribute('content'))).toEqual([
            'https://schema.org/Monday',
            'https://schema.org/Tuesday',
            'https://schema.org/Wednesday',
            'https://schema.org/Thursday'
        ]);
        expect(specifications[1]?.querySelector('[itemprop="opens"]')?.getAttribute('datetime')).toBe('14:00');
        expect(specifications[1]?.querySelector('[itemprop="closes"]')?.getAttribute('datetime')).toBe('18:00');
    });
});

describe('OpeningHoursUtilities.isOpen', () => {
    test('is open from when a range opens until it closes, past midnight for a range that closes before it opens', () => {
        const bar: OpeningHoursDay[] = [{ weekday: 5, ranges: [{ opens: '18:00', closes: '02:00' }] }];

        expect(OpeningHoursUtilities.isOpen(WEEK, { weekday: 1, minutes: 8 * 60 })).toBe(true);
        expect(OpeningHoursUtilities.isOpen(WEEK, { weekday: 1, minutes: 12 * 60 })).toBe(false);
        expect(OpeningHoursUtilities.isOpen(WEEK, { weekday: 6, minutes: 10 * 60 })).toBe(false);
        expect(OpeningHoursUtilities.isOpen(bar, { weekday: 5, minutes: 23 * 60 })).toBe(true);
        expect(OpeningHoursUtilities.isOpen(bar, { weekday: 6, minutes: 60 })).toBe(true);
        expect(OpeningHoursUtilities.isOpen(bar, { weekday: 6, minutes: 3 * 60 })).toBe(false);
        expect(OpeningHoursUtilities.isOpen(bar, { weekday: 5, minutes: 17 * 60 })).toBe(false);
    });
});
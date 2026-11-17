import { Component, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideDatePeriodConfig } from './date-period-config.provider';
import { DatePeriodComponent } from './date-period.component';
import { DatePeriodPipe } from './date-period.pipe';
import { DatePeriodUtilities } from './date-period.utilities';

@Component({
    selector: 'ui-date-period-host',
    template: `
        <ui-date-period id="closed" [start]="start" [end]="end" /><ui-date-period id="open" start="2022-02" end="open" />
        <ui-date-period id="single" [start]="start" /><ui-date-period id="same-month" start="2024-03-01" end="2024-03-20" />
        <ui-date-period id="function" [start]="start" [end]="end" [format]="writeYear" />
    `,
    imports: [DatePeriodComponent]
})
class DatePeriodHostComponent {
    readonly start: Date = new Date(2022, 1, 14);

    readonly end: Date = new Date(2024, 2, 3);

    readonly writeYear: (date: Date, locale: string) => string = (date, locale) => `${locale}:${date.getFullYear()}`;
}

@Component({
    selector: 'ui-date-period-pipe-host',
    template: '<span id="pipe">{{ start | uiDatePeriod: end : short }}</span><span id="pipe-open">{{ start | uiDatePeriod: "open" }}</span>',
    imports: [DatePeriodPipe]
})
class DatePeriodPipeHostComponent {
    readonly start: Date = new Date(2022, 1, 14);

    readonly end: Date = new Date(2024, 2, 3);

    readonly short: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
}

// both hosts, whose elements the tests find by their ids.
async function render(): Promise<HTMLElement[]> {
    const roots: HTMLElement[] = [];
    for (const host of [DatePeriodHostComponent, DatePeriodPipeHostComponent]) {
        const fixture: ComponentFixture<unknown> = TestBed.createComponent<unknown>(host);
        await fixture.whenStable();
        roots.push(fixture.nativeElement as HTMLElement);
    }
    return roots;
}

function findElement(roots: HTMLElement[], id: string): Element | undefined {
    return roots.map(root => root.querySelector(`#${id}`)).find(element => element != undefined) ?? undefined;
}

function getText(roots: HTMLElement[], id: string): string {
    return findElement(roots, id)?.textContent.trim() ?? '';
}

function getDateTimes(roots: HTMLElement[], id: string): (string | null)[] {
    return [...findElement(roots, id)?.querySelectorAll('time') ?? []].map(time => time.getAttribute('datetime'));
}

describe('DatePeriodComponent and DatePeriodPipe', () => {
    test('write a period, one that is still going on and a single date in the language of the app', async () => {
        const root: HTMLElement[] = await render();

        expect(getText(root, 'closed')).toBe('02/2022 – 03/2024');
        expect(getText(root, 'open')).toBe('02/2022 – today');
        expect(getText(root, 'single')).toBe('02/2022');
        // both dates show the same month, so it is one date
        expect(getText(root, 'same-month')).toBe('03/2024');
        expect(getText(root, 'pipe')).toBe('Feb 2022 – Mar 2024');
        expect(getText(root, 'pipe-open')).toBe('02/2022 – today');
        expect(getText(root, 'function')).toBe('en-US:2022 – en-US:2024');
    });

    test('puts every date into a time element with the day it stands for, but not the open end', async () => {
        const root: HTMLElement[] = await render();

        expect(getDateTimes(root, 'closed')).toEqual(['2022-02-14', '2024-03-03']);
        // a month without a day is its first day, in the local calendar rather than in UTC
        expect(getDateTimes(root, 'open')).toEqual(['2022-02-01']);
        expect(getDateTimes(root, 'single')).toEqual(['2022-02-14']);
    });

    test('takes the format, the open end and the separator the app provides', async () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: LOCALE_ID, useValue: 'de' },
                provideDatePeriodConfig({ format: { month: 'long', year: 'numeric' }, openEndLabel: 'heute', separator: ' bis ' })
            ]
        });
        const root: HTMLElement[] = await render();

        expect(getText(root, 'closed')).toBe('Februar 2022 bis März 2024');
        expect(getText(root, 'open')).toBe('Februar 2022 bis heute');
        expect(getText(root, 'pipe')).toBe('Feb. 2022 bis März 2024');
    });
});

describe('DatePeriodUtilities', () => {
    test('reads dates without a time as days of the local calendar, and anything else like new Date()', () => {
        expect(DatePeriodUtilities.resolveDate('2022-02')).toEqual(new Date(2022, 1, 1));
        expect(DatePeriodUtilities.resolveDate('2022-02-14')).toEqual(new Date(2022, 1, 14));
        expect(DatePeriodUtilities.resolveDate('2022-02-14T10:00:00Z')).toEqual(new Date(Date.UTC(2022, 1, 14, 10)));
        expect(DatePeriodUtilities.resolveDate(0)).toEqual(new Date(0));
    });
});
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputValidation, provideInputConfig } from '@service-soft/ui/input';
import { InputDateUtilities } from '@service-soft/ui/input-date';
import { InputTimeUtilities } from '@service-soft/ui/input-time';
import { describe, expect, test } from 'vitest';

import { InputDateRangeDuration } from './input-date-range-duration.model';
import { InputDateRangeTimes } from './input-date-range-times.type';
import { InputDateRangeComponent } from './input-date-range.component';
import { InputDateRange } from './input-date-range.model';
import { InputDateRangeUtilities } from './input-date-range.utilities';

@Component({
    selector: 'ui-range-host',
    template: `<ui-input-date-range label="Holiday" hint="Arrival and departure" startLabel="Arrival" endLabel="Departure" name="holiday"
        [min]="min" [max]="max" [minDuration]="minDuration()" [maxDuration]="maxDuration()" [dayValidation]="validateDay"
        [(value)]="range" />`,
    imports: [InputDateRangeComponent]
})
class RangeHostComponent {
    readonly min: Date = new Date(2026, 10, 2);
    readonly max: Date = new Date(2027, 1, 28);
    readonly minDuration: WritableSignal<InputDateRangeDuration | undefined> = signal({ days: 2 });
    readonly maxDuration: WritableSignal<InputDateRangeDuration | undefined> = signal({ days: 7 });
    readonly range: WritableSignal<InputDateRange> = signal({ start: new Date(2026, 10, 12), end: new Date(2026, 10, 15) });
    // the 15th of November 2026 is a Sunday, the day the house is cleaned
    readonly validateDay: InputValidation<Date> = day => day.getDay() === 0 ? 'Not on Sundays.' : undefined;
}

@Component({
    selector: 'ui-rental-host',
    template: `<ui-input-date-range label="Rental" startLabel="Pick-up" endLabel="Return" [required]="false" [times]="openingHours"
        [maxDuration]="{ hours: 48 }" [showValidationError]="true" [(value)]="rental" />`,
    imports: [InputDateRangeComponent]
})
class RentalHostComponent {
    readonly rental: WritableSignal<InputDateRange> = signal({ start: undefined, end: undefined });
    // shorter on Saturdays, closed on Sundays
    readonly openingHours: InputDateRangeTimes = day => {
        switch (day.getDay()) {
            case 0: {
                return [];
            }
            case 6: {
                return InputTimeUtilities.resolveTimes('09:00', '12:00', 60);
            }
            default: {
                return InputTimeUtilities.resolveTimes('08:00', '18:00', 30);
            }
        }
    };
}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the inputs of the days, or of the times
function getInputs(root: HTMLElement, times: boolean = false): [HTMLInputElement, HTMLInputElement] {
    const [start, end] = Array.from(root.querySelectorAll<HTMLInputElement>(times ? 'input[id$="-time"]' : 'input:not([id$="-time"])'));
    if (start == undefined || end == undefined) {
        throw new Error('The inputs did not render.');
    }
    return [start, end];
}

// jsdom has no popovers: the test setup marks an open one, and the toggle event the browser sends is sent by hand.
async function openTimePicker(fixture: ComponentFixture<unknown>, root: HTMLElement, side: 'start' | 'end'): Promise<HTMLElement | null> {
    const picker: HTMLElement | null = root.querySelector(`[id$="-${side}-time-picker"]`);
    picker?.showPopover();
    picker?.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }));
    await fixture.whenStable();
    return picker;
}

async function type(fixture: ComponentFixture<unknown>, input: HTMLInputElement, text: string): Promise<void> {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
}

// what screen readers read as the name of an element, from the ids it is labelled by
function findName(root: HTMLElement, element: HTMLElement): string {
    const ids: string[] = element.getAttribute('aria-labelledby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.replace('*', '').trim()).join(' ');
}

function findError(root: HTMLElement, input: HTMLInputElement): string | undefined {
    const ids: string[] = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

// jsdom has no popovers: the test setup marks an open one, and the toggle event the browser sends when a button opens
// it is sent by hand, after the click on the button.
async function openCalendar(fixture: ComponentFixture<unknown>, root: HTMLElement, side: 'start' | 'end'): Promise<void> {
    const buttons: HTMLButtonElement[] = Array.from(root.querySelectorAll('button[popovertarget$="-calendar"]'));
    const calendar: HTMLElement | null = root.querySelector('[popover][id$="-calendar"]');
    buttons[side === 'start' ? 0 : 1]?.click();
    calendar?.showPopover();
    calendar?.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }));
    await fixture.whenStable();
}

function findDay(root: HTMLElement, label: string): HTMLElement {
    const day: HTMLElement | undefined = root.querySelector<HTMLElement>(`[role="gridcell"][aria-label="${label}"]`) ?? undefined;
    if (day == undefined) {
        throw new Error(`The calendar shows no ${label}.`);
    }
    return day;
}

async function click(fixture: ComponentFixture<unknown>, element: HTMLElement): Promise<void> {
    element.click();
    await fixture.whenStable();
}

describe('InputDateRangeComponent', () => {
    test('binds the range two-way, its sides as texts in the language of the app, each named by the range and its side', async () => {
        const [fixture, root] = await render(RangeHostComponent);
        const [start, end] = getInputs(root);
        expect(start.value).toBe('11/12/2026');
        expect(end.value).toBe('11/15/2026');
        expect(root.querySelector('label')?.getAttribute('for')).toBe(start.id);
        expect(findName(root, start)).toBe('Holiday Arrival');
        expect(findName(root, end)).toBe('Holiday Departure');
        expect([start.name, end.name]).toEqual(['holiday-start', 'holiday-end']);
        expect(start.required && end.required).toBe(true);
        expect(root.querySelector('select')).toBeNull();

        await type(fixture, end, '11/18/2026');
        expect(fixture.componentInstance.range()).toEqual({ start: new Date(2026, 10, 12), end: new Date(2026, 10, 18) });

        fixture.componentInstance.range.set({ start: new Date(2026, 11, 1), end: undefined });
        await fixture.whenStable();
        expect([start.value, end.value]).toEqual(['12/01/2026', '']);
    });

    test('checks that the texts are dates, the range is complete and in order, within min and max', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ errorMessages: { rangeIncomplete: 'Beides wählen.' } })] });
        const [fixture, root] = await render(RangeHostComponent);
        const [start, end] = getInputs(root);
        fixture.componentInstance.minDuration.set(undefined);
        fixture.componentInstance.maxDuration.set(undefined);

        await type(fixture, end, '11/1');
        end.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        await fixture.whenStable();
        expect(fixture.componentInstance.range().end).toBeUndefined();
        expect(start.validity.customError).toBe(true);
        expect(findError(root, start)).toBe('The value can\'t be read.');
        expect(end.getAttribute('aria-invalid')).toBe('true');

        await type(fixture, end, '');
        expect(findError(root, start)).toBe('Beides wählen.');
        await type(fixture, end, '11/10/2026');
        expect(findError(root, start)).toBe('The end is before the start.');
        await type(fixture, start, '11/1/2026');
        expect(findError(root, start)).toBe('The value is too small.');
        await type(fixture, start, '2/1/2027');
        await type(fixture, end, '3/1/2027');
        expect(findError(root, start)).toBe('The value is too large.');

        await type(fixture, start, '11/16/2026');
        await type(fixture, end, '11/20/2026');
        expect(start.checkValidity()).toBe(true);
        expect(findError(root, start)).toBe('Arrival and departure');
    });

    test('checks the days of both sides and the duration in days', async () => {
        const [fixture, root] = await render(RangeHostComponent);
        const [start, end] = getInputs(root);
        start.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        await fixture.whenStable();
        expect(findError(root, start)).toBe('Not on Sundays.');

        await type(fixture, end, '11/13/2026');
        expect(findError(root, start)).toBe('The period is too short.');
        await type(fixture, end, '11/20/2026');
        expect(findError(root, start)).toBe('The period is too long.');
        await type(fixture, end, '11/19/2026');
        expect(start.checkValidity()).toBe(true);
    });

    test('doesn\'t show an error before focus left the whole range', async () => {
        const [fixture, root] = await render(RangeHostComponent);
        const [start, end] = getInputs(root);
        await type(fixture, end, '');

        start.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: end }));
        await fixture.whenStable();
        expect(start.getAttribute('aria-invalid')).toBeNull();
        end.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        await fixture.whenStable();
        expect(start.getAttribute('aria-invalid')).toBe('true');
    });

    test('chooses the start and then the end in one calendar, which shows the range', async () => {
        const [fixture, root] = await render(RangeHostComponent);
        fixture.componentInstance.range.set({ start: new Date(2026, 10, 10), end: undefined });
        await fixture.whenStable();
        const calendar: HTMLElement | null = root.querySelector('[popover]');
        expect(Array.from(root.querySelectorAll('button[popovertarget]'), button => button.getAttribute('aria-label')))
            .toEqual(['Choose the dates, Arrival', 'Choose the dates, Departure']);

        await openCalendar(fixture, root, 'start');
        expect(root.querySelector('p[aria-live]')?.textContent?.trim()).toBe('Arrival');
        await click(fixture, findDay(root, 'Monday, November 16, 2026'));
        expect(fixture.componentInstance.range()).toEqual({ start: new Date(2026, 10, 16), end: undefined });
        expect(calendar?.hasAttribute('data-popover-open')).toBe(true);
        expect(root.querySelector('p[aria-live]')?.textContent?.trim()).toBe('Departure');

        // too short and too long for the end, and Sundays for either side. The start stays chosen, not disabled, and
        // choosing it again keeps it the start, as a range of one day is too short.
        expect(findDay(root, 'Monday, November 16, 2026').getAttribute('aria-disabled')).toBe('false');
        await click(fixture, findDay(root, 'Monday, November 16, 2026'));
        expect(fixture.componentInstance.range()).toEqual({ start: new Date(2026, 10, 16), end: undefined });
        expect(calendar?.hasAttribute('data-popover-open')).toBe(true);
        expect(findDay(root, 'Tuesday, November 17, 2026').getAttribute('aria-disabled')).toBe('true');
        expect(findDay(root, 'Wednesday, November 18, 2026').getAttribute('aria-disabled')).toBe('false');
        expect(findDay(root, 'Monday, November 23, 2026').getAttribute('aria-disabled')).toBe('false');
        expect(findDay(root, 'Tuesday, November 24, 2026').getAttribute('aria-disabled')).toBe('true');
        expect(findDay(root, 'Sunday, November 22, 2026').getAttribute('aria-disabled')).toBe('true');
        expect(findDay(root, 'Friday, November 13, 2026').getAttribute('aria-disabled')).toBe('false');

        await click(fixture, findDay(root, 'Friday, November 20, 2026'));
        expect(fixture.componentInstance.range()).toEqual({ start: new Date(2026, 10, 16), end: new Date(2026, 10, 20) });
        expect(getInputs(root).map(input => input.value)).toEqual(['11/16/2026', '11/20/2026']);
        expect(calendar?.hasAttribute('data-popover-open')).toBe(false);
    });

    test('marks both sides as chosen and the days between them, and starts again with a day before the start', async () => {
        const [fixture, root] = await render(RangeHostComponent);
        fixture.componentInstance.range.set({ start: new Date(2026, 10, 16), end: new Date(2026, 10, 19) });
        await fixture.whenStable();

        await openCalendar(fixture, root, 'end');
        expect(Array.from(root.querySelectorAll('[role="gridcell"][aria-selected="true"]'), cell => cell.getAttribute('aria-label')))
            .toEqual(['Monday, November 16, 2026', 'Thursday, November 19, 2026']);
        const between: HTMLElement | null = findDay(root, 'Tuesday, November 17, 2026').querySelector('span');
        expect(between?.classList.contains('bg-primary-tint')).toBe(true);
        expect(findDay(root, 'Friday, November 20, 2026').querySelector('span')?.classList.contains('bg-primary-tint')).toBe(false);

        await click(fixture, findDay(root, 'Friday, November 13, 2026'));
        // the end is after the new start, so it stays, and the calendar closes
        expect(fixture.componentInstance.range()).toEqual({ start: new Date(2026, 10, 13), end: new Date(2026, 10, 19) });
        expect(root.querySelector('[popover]')?.hasAttribute('data-popover-open')).toBe(false);
    });

    test('chooses the start first, also from the button of the end', async () => {
        const [fixture, root] = await render(RangeHostComponent);
        fixture.componentInstance.range.set({ start: undefined, end: undefined });
        await fixture.whenStable();

        await openCalendar(fixture, root, 'end');
        expect(root.querySelector('p[aria-live]')?.textContent?.trim()).toBe('Arrival');
    });

    test('keeps the chosen start selected when it is chosen as the end as well', async () => {
        const [fixture, root] = await render(RangeHostComponent);
        fixture.componentInstance.range.set({ start: new Date(2026, 10, 10), end: undefined });
        fixture.componentInstance.minDuration.set(undefined);
        await fixture.whenStable();

        await openCalendar(fixture, root, 'start');
        await click(fixture, findDay(root, 'Monday, November 16, 2026'));
        // the grid deselects a selected cell that is chosen again
        await click(fixture, findDay(root, 'Monday, November 16, 2026'));
        await fixture.whenStable();
        expect(fixture.componentInstance.range()).toEqual({ start: new Date(2026, 10, 16), end: new Date(2026, 10, 16) });
        expect(findDay(root, 'Monday, November 16, 2026').getAttribute('aria-selected')).toBe('true');
    });

    test('offers the times of the day of each side, starting at the first one, and checks them', async () => {
        const [fixture, root] = await render(RentalHostComponent);
        const [start, end] = getInputs(root);
        const [startTime, endTime] = getInputs(root, true);
        const startPicker: HTMLButtonElement | null = root.querySelector('button[popovertarget$="-start-time-picker"]');
        expect(findName(root, startTime)).toBe('Rental Pick-up Time');
        expect(startPicker?.getAttribute('aria-label')).toBe('Choose a time, Pick-up');
        // the times depend on the day, so there are none without one
        expect(startPicker?.disabled).toBe(true);

        // the 13th of November 2026 is a Friday, the 14th a Saturday
        await type(fixture, start, '11/13/2026');
        expect(fixture.componentInstance.rental().start).toEqual(new Date(2026, 10, 13, 8, 0));
        expect(startTime.value).toMatch(/^8:00\sAM$/);
        expect(startPicker?.disabled).toBe(false);
        expect(findError(root, start)).toBe('Choose the start and the end.');

        await type(fixture, startTime, '5:30 pm');
        await type(fixture, end, '11/14/2026');
        expect(fixture.componentInstance.rental()).toEqual({ start: new Date(2026, 10, 13, 17, 30), end: new Date(2026, 10, 14, 9, 0) });
        expect(endTime.value).toMatch(/^9:00\sAM$/);
        expect(start.checkValidity()).toBe(true);

        // a Monday keeps the time of the end, which it offers as well
        await type(fixture, end, '11/16/2026');
        expect(fixture.componentInstance.rental().end).toEqual(new Date(2026, 10, 16, 9, 0));
        expect(findError(root, start)).toBe('The period is too long.');

        // a time the day doesn't offer is kept, and shows its error, like a text that is no time
        fixture.componentInstance.rental.set({ start: new Date(2026, 10, 13, 7, 0), end: new Date(2026, 10, 14, 9, 0) });
        await fixture.whenStable();
        expect(startTime.value).toMatch(/^7:00\sAM$/);
        expect(findError(root, start)).toBe('This time isn\'t available.');
        await type(fixture, endTime, '9:7:1');
        expect(findError(root, start)).toBe('The value can\'t be read.');
    });

    test('chooses a time in the picker of a side, from the times of its day', async () => {
        const [fixture, root] = await render(RentalHostComponent);
        fixture.componentInstance.rental.set({ start: new Date(2026, 10, 13, 9, 0), end: new Date(2026, 10, 14, 9, 0) });
        await fixture.whenStable();
        const [, endTime] = getInputs(root, true);

        const picker: HTMLElement | null = await openTimePicker(fixture, root, 'end');
        const options: HTMLElement[] = Array.from(root.querySelectorAll<HTMLElement>('[role="option"]'));
        expect(options.map(option => option.textContent?.trim().replace(/\s/, ' '))).toEqual(['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM']);
        expect(document.activeElement).toBe(options[0]);

        options[2]?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.rental().end).toEqual(new Date(2026, 10, 14, 11, 0));
        expect(endTime.value).toMatch(/^11:00\sAM$/);
        expect(picker?.hasAttribute('data-popover-open')).toBe(false);
        expect(document.activeElement).toBe(endTime);
    });

    test('doesn\'t offer the days without times in the calendar', async () => {
        const [fixture, root] = await render(RentalHostComponent);
        fixture.componentInstance.rental.set({ start: new Date(2026, 10, 13, 9, 0), end: undefined });
        await fixture.whenStable();

        await openCalendar(fixture, root, 'end');
        expect(findDay(root, 'Sunday, November 15, 2026').getAttribute('aria-disabled')).toBe('true');
        await click(fixture, findDay(root, 'Monday, November 16, 2026'));
        expect(fixture.componentInstance.rental().end).toEqual(new Date(2026, 10, 16, 8, 0));
    });
});

describe('InputDateRangeUtilities', () => {
    test('resolves the times of a day, the same every day or the ones of it', () => {
        expect(InputDateRangeUtilities.resolveTimesOfDay(['09:00'], new Date(2026, 10, 15))).toEqual(['09:00']);
        expect(InputDateRangeUtilities.resolveTimesOfDay(day => day.getDay() === 0 ? [] : ['09:00'], new Date(2026, 10, 15))).toEqual([]);
    });

    test('compares a range with a duration in days by its days, and in hours by its moments', () => {
        const start: Date = new Date(2026, 10, 12, 18, 0);
        const end: Date = new Date(2026, 10, 15, 9, 0);
        expect(InputDateRangeUtilities.resolveDurationDifference(start, end, { days: 3 })).toBe(0);
        expect(InputDateRangeUtilities.resolveDurationDifference(start, end, { days: 4 })).toBe(-1);
        expect(InputDateRangeUtilities.resolveDurationDifference(start, end, { hours: 60 })).toBe(3);
        expect(InputDateRangeUtilities.resolveMoment(new Date(2026, 10, 12, 23, 59), '09:30')).toEqual(new Date(2026, 10, 12, 9, 30));
    });

    test('counts days across a change of the clocks as whole days', () => {
        // the clocks change at the end of March and October in Europe, and in March and November in the US
        expect(InputDateUtilities.resolveDaysBetween(new Date(2026, 2, 1), new Date(2026, 3, 1))).toBe(31);
        expect(InputDateUtilities.resolveDaysBetween(new Date(2026, 9, 1), new Date(2026, 10, 30))).toBe(60);
        expect(InputDateUtilities.resolveDayStart(new Date(2026, 9, 31, 22), 1)).toEqual(new Date(2026, 10, 1));
    });
});
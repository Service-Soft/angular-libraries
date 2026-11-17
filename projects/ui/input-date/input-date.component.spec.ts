import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputValidation, provideInputConfig } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { InputDateCalendarComponent } from './input-date-calendar.component';
import { InputDateComponent } from './input-date.component';
import { InputDateUtilities } from './input-date.utilities';

@Component({
    selector: 'ui-two-way-host',
    template: '<ui-input-date label="Birthday" hint="As in your passport" name="birthday" [(value)]="birthday" />',
    imports: [InputDateComponent]
})
class TwoWayHostComponent {
    readonly birthday: WritableSignal<Date | undefined> = signal(new Date(1990, 4, 17));
}

@Component({
    selector: 'ui-range-host',
    template: `
        <ui-input-date label="Delivery" type="datetime-local" [min]="min" [max]="max" [customValidation]="validateWeekday" [showValidationError]="true" [(value)]="delivery" />
    `,
    imports: [InputDateComponent]
})
class RangeHostComponent {
    readonly min: Date = new Date(2026, 10, 2, 8, 0);
    readonly max: Date = new Date(2026, 10, 30, 18, 0);
    readonly delivery: WritableSignal<Date | undefined> = signal(undefined);
    // a Sunday is the one day nobody delivers
    readonly validateWeekday: InputValidation<Date | undefined> = value => value?.getDay() === 0 ? 'No deliveries on Sundays.' : undefined;
}

@Component({
    selector: 'ui-calendar-host',
    template: '<ui-input-date-calendar [value]="value" [min]="min" [max]="max" (chosen)="chosen.push($event)" />',
    imports: [InputDateCalendarComponent]
})
class CalendarHostComponent {
    readonly value: Date = new Date(2026, 10, 12, 9, 30);
    readonly min: Date = new Date(2026, 10, 2, 8, 0);
    readonly max: Date = new Date(2026, 10, 30, 18, 0);
    readonly chosen: Date[] = [];
}

@Component({
    selector: 'ui-unbounded-calendar-host',
    template: '<ui-input-date-calendar [value]="value" />',
    imports: [InputDateCalendarComponent]
})
class UnboundedCalendarHostComponent {
    readonly value: Date = new Date(2026, 10, 12);
}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getInput(root: HTMLElement): HTMLInputElement {
    const input: HTMLInputElement | undefined = root.querySelector('input') ?? undefined;
    if (input == undefined) {
        throw new Error('The input did not render.');
    }
    return input;
}

async function type(fixture: ComponentFixture<unknown>, input: HTMLInputElement, text: string): Promise<void> {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
}

function findDay(root: HTMLElement, label: string): HTMLElement {
    const day: HTMLElement | undefined = root.querySelector<HTMLElement>(`[role="gridcell"][aria-label="${label}"]`) ?? undefined;
    if (day == undefined) {
        throw new Error(`The calendar shows no ${label}.`);
    }
    return day;
}

function findButton(root: HTMLElement, label: string): HTMLButtonElement {
    const button: HTMLButtonElement | undefined = root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`) ?? undefined;
    if (button == undefined) {
        throw new Error(`The calendar shows no button ${label}.`);
    }
    return button;
}

// a year or a month, which shows its name rather than reading a label
function findOption(root: HTMLElement, name: string): HTMLElement {
    const option: HTMLElement | undefined = Array.from(root.querySelectorAll<HTMLElement>('[role="gridcell"]'))
        .find(cell => cell.textContent?.trim() === name);
    if (option == undefined) {
        throw new Error(`The calendar shows no ${name}.`);
    }
    return option;
}

function getHeaderButton(root: HTMLElement): HTMLButtonElement {
    const button: HTMLButtonElement | undefined = root.querySelector<HTMLButtonElement>('button[aria-expanded]') ?? undefined;
    if (button == undefined) {
        throw new Error('The calendar shows no month to switch to the years with.');
    }
    return button;
}

// what screen readers read as the heads of the columns
function findHeaders(root: HTMLElement): string[] {
    return Array.from(root.querySelectorAll('th .sr-only'), header => header.textContent?.trim() ?? '');
}

function findDescription(root: HTMLElement, input: HTMLInputElement): string | undefined {
    const ids: string[] = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

describe('InputDateComponent', () => {
    test('binds the value two-way as a Date at midnight in the time zone of the browser, as text in the language of the app', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const input: HTMLInputElement = getInput(root);
        expect(input.type).toBe('text');
        expect(input.name).toBe('birthday');
        expect(input.value).toBe('05/17/1990');
        expect(input.placeholder).toBe(`12/31/${new Date().getFullYear()}`);

        await type(fixture, input, '12/31/2001');
        expect(fixture.componentInstance.birthday()).toEqual(new Date(2001, 11, 31));

        fixture.componentInstance.birthday.set(new Date(2010, 0, 1, 23, 30));
        await fixture.whenStable();
        expect(input.value).toBe('01/01/2010');

        fixture.componentInstance.birthday.set(undefined);
        await fixture.whenStable();
        expect(input.value).toBe('');
    });

    test('keeps what the user types until it is a date, and writes it in the format once they leave', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ errorMessages: { badInput: 'Kein Datum.' } })] });
        const [fixture, root] = await render(TwoWayHostComponent);
        const input: HTMLInputElement = getInput(root);

        await type(fixture, input, '3/4/20');
        expect(input.value).toBe('3/4/20');
        expect(fixture.componentInstance.birthday()).toBeUndefined();
        input.dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(input.value).toBe('3/4/20');
        expect(input.validity.customError).toBe(true);
        expect(findDescription(root, input)).toBe('Kein Datum.');

        await type(fixture, input, '3/4/2020');
        input.dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(fixture.componentInstance.birthday()).toEqual(new Date(2020, 2, 4));
        expect(input.value).toBe('03/04/2020');
        expect(input.checkValidity()).toBe(true);
    });

    test('is labelled, described by its hint and required unless it says otherwise', async () => {
        const [, root] = await render(TwoWayHostComponent);
        const input: HTMLInputElement = getInput(root);

        expect(root.querySelector('label')?.getAttribute('for')).toBe(input.id);
        expect(input.required).toBe(true);
        expect(findDescription(root, input)).toBe('As in your passport');
    });

    test('takes a day and its time, within min and max, and checks customValidation after them', async () => {
        const [fixture, root] = await render(RangeHostComponent);
        const input: HTMLInputElement = getInput(root);

        await type(fixture, input, '11/12/2026, 09:30 PM');
        expect(fixture.componentInstance.delivery()).toEqual(new Date(2026, 10, 12, 21, 30));
        expect(input.checkValidity()).toBe(true);

        await type(fixture, input, '11/2/2026 7:59 am');
        expect(fixture.componentInstance.delivery()).toEqual(new Date(2026, 10, 2, 7, 59));
        expect(findDescription(root, input)).toBe('The value is too small.');
        await type(fixture, input, '11/30/2026, 18:01');
        expect(findDescription(root, input)).toBe('The value is too large.');

        // the 15th of November 2026 is a Sunday
        await type(fixture, input, '11/15/2026, 09:30 AM');
        expect(input.validity.customError).toBe(true);
        expect(findDescription(root, input)).toBe('No deliveries on Sundays.');
    });

    test('opens a calendar with its button, whose day keeps the time of the value and closes it', async () => {
        const [fixture, root] = await render(RangeHostComponent);
        fixture.componentInstance.delivery.set(new Date(2026, 10, 12, 9, 30));
        await fixture.whenStable();
        const button: HTMLButtonElement | null = root.querySelector('button[popovertarget]');
        const calendar: HTMLElement | null = root.querySelector('[popover]');
        expect(button?.getAttribute('aria-label')).toBe('Choose a date');
        expect(button?.getAttribute('popovertarget')).toBe(calendar?.id);
        expect(root.querySelector('[role="grid"]')).toBeNull();

        // jsdom has no popovers: the test setup marks an open one, and the toggle event the browser sends when the
        // button opens it is sent by hand
        calendar?.showPopover();
        calendar?.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }));
        await fixture.whenStable();
        findDay(root, 'Monday, November 16, 2026').click();
        await fixture.whenStable();
        expect(fixture.componentInstance.delivery()).toEqual(new Date(2026, 10, 16, 9, 30));
        // the language may put a narrow space before AM
        expect(getInput(root).value).toMatch(/^11\/16\/2026, 09:30\sAM$/);
        expect(calendar?.hasAttribute('data-popover-open')).toBe(false);
    });

    test('doesn\'t offer the days in the calendar that customValidation rejects', async () => {
        const [fixture, root] = await render(RangeHostComponent);
        const calendar: HTMLElement | null = root.querySelector('[popover]');

        calendar?.showPopover();
        calendar?.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }));
        await fixture.whenStable();
        expect(findDay(root, 'Sunday, November 15, 2026').getAttribute('aria-disabled')).toBe('true');
        expect(findDay(root, 'Monday, November 16, 2026').getAttribute('aria-disabled')).toBe('false');

        findDay(root, 'Sunday, November 15, 2026').click();
        await fixture.whenStable();
        expect(fixture.componentInstance.delivery()).toBeUndefined();
    });

    test('shows that a date is missing instead of the popup of the browser', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ errorMessages: { valueMissing: 'Pflichtfeld.' } })] });
        const [fixture, root] = await render(TwoWayHostComponent);
        fixture.componentInstance.birthday.set(undefined);
        await fixture.whenStable();
        const input: HTMLInputElement = getInput(root);

        const invalid: Event = new Event('invalid', { cancelable: true });
        input.dispatchEvent(invalid);
        await fixture.whenStable();
        expect(invalid.defaultPrevented).toBe(true);
        expect(findDescription(root, input)).toBe('Pflichtfeld.');
    });
});

describe('InputDateUtilities', () => {
    test('writes a date by its local parts, which keeps the day the user sees in every time zone', () => {
        expect(InputDateUtilities.getNativeValue(new Date(2026, 0, 1, 0, 5), 'date')).toBe('2026-01-01');
        expect(InputDateUtilities.getNativeValue(new Date(2026, 0, 1, 0, 5), 'datetime-local')).toBe('2026-01-01T00:05');
        expect(InputDateUtilities.getNativeValue(undefined, 'date')).toBe('');
        expect(InputDateUtilities.getNativeValue(new Date(Number.NaN), 'date')).toBe('');
    });

    test('reads a date in the order of the language, and nothing from a text that is no complete and existing date', () => {
        const usFormat: Intl.DateTimeFormat = InputDateUtilities.resolveFormat('en-US', 'date');
        const germanFormat: Intl.DateTimeFormat = InputDateUtilities.resolveFormat('de', 'date');
        const yearFirstFormat: Intl.DateTimeFormat = InputDateUtilities.resolveFormat('ja', 'date');
        expect(InputDateUtilities.findDateInText('11/12/2026', usFormat)).toEqual(new Date(2026, 10, 12));
        expect(InputDateUtilities.findDateInText('12.11.2026', germanFormat)).toEqual(new Date(2026, 10, 12));
        expect(InputDateUtilities.findDateInText('2026/11/12', yearFirstFormat)).toEqual(new Date(2026, 10, 12));
        expect(InputDateUtilities.findDateInText(' 1 - 2 - 2026 ', germanFormat)).toEqual(new Date(2026, 1, 1));

        expect(InputDateUtilities.findDateInText('', usFormat)).toBeUndefined();
        expect(InputDateUtilities.findDateInText('11/12', usFormat)).toBeUndefined();
        expect(InputDateUtilities.findDateInText('11/12/26', usFormat)).toBeUndefined();
        expect(InputDateUtilities.findDateInText('02/30/2026', usFormat)).toBeUndefined();
        expect(InputDateUtilities.findDateInText('11/12/2026/1', usFormat)).toBeUndefined();
    });

    test('reads the time with AM and PM of the language, or as 24-hour without them', () => {
        const usFormat: Intl.DateTimeFormat = InputDateUtilities.resolveFormat('en-US', 'datetime-local');
        const germanFormat: Intl.DateTimeFormat = InputDateUtilities.resolveFormat('de', 'datetime-local');
        expect(usFormat.format(new Date(2026, 10, 12, 21, 30))).toMatch(/^11\/12\/2026, 09:30\sPM$/);
        expect(germanFormat.format(new Date(2026, 10, 12, 21, 30))).toBe('12.11.2026, 21:30');

        expect(InputDateUtilities.findDateInText('11/12/2026, 09:30 PM', usFormat)).toEqual(new Date(2026, 10, 12, 21, 30));
        expect(InputDateUtilities.findDateInText('11/12/2026 12:05am', usFormat)).toEqual(new Date(2026, 10, 12, 0, 5));
        expect(InputDateUtilities.findDateInText('11/12/2026 12:05 PM', usFormat)).toEqual(new Date(2026, 10, 12, 12, 5));
        expect(InputDateUtilities.findDateInText('11/12/2026 21:30', usFormat)).toEqual(new Date(2026, 10, 12, 21, 30));
        expect(InputDateUtilities.findDateInText('12.11.2026, 21:30', germanFormat)).toEqual(new Date(2026, 10, 12, 21, 30));
        expect(InputDateUtilities.findDateInText('12.11.2026, 24:30', germanFormat)).toBeUndefined();
        expect(InputDateUtilities.findDateInText('12.11.2026', germanFormat)).toBeUndefined();
    });

    test('fills six whole weeks around a month, starting with the first day of the week', () => {
        // the 1st of November 2026 is a Sunday
        const fromMonday: Date[][] = InputDateUtilities.resolveCalendarWeeks(new Date(2026, 10, 12, 9, 30), 1);
        expect(fromMonday.map(week => week.length)).toEqual([7, 7, 7, 7, 7, 7]);
        expect(fromMonday[0]?.[0]).toEqual(new Date(2026, 9, 26));
        expect(fromMonday[0]?.[6]).toEqual(new Date(2026, 10, 1));
        expect(fromMonday[5]?.[6]).toEqual(new Date(2026, 11, 6));

        const fromSunday: Date[][] = InputDateUtilities.resolveCalendarWeeks(new Date(2026, 10, 1), 0);
        expect(fromSunday[0]?.[0]).toEqual(new Date(2026, 10, 1));
    });

    test('compares days, not moments', () => {
        expect(InputDateUtilities.isSameDay(new Date(2026, 10, 12, 23, 59), new Date(2026, 10, 12))).toBe(true);
        expect(InputDateUtilities.isSameDay(new Date(2026, 10, 13), new Date(2026, 10, 12))).toBe(false);
        expect(InputDateUtilities.isSameDay(undefined, new Date(2026, 10, 12))).toBe(false);
    });
});

describe('InputDateCalendarComponent', () => {
    test('shows the month of the value in the language of the app, with weeks from the configured first day', async () => {
        const [, root] = await render(CalendarHostComponent);

        expect(root.querySelector('[aria-live]')?.textContent?.trim()).toBe('November 2026');
        expect(root.querySelector('[role="grid"]')?.getAttribute('aria-labelledby')).toBe(root.querySelector('[aria-live]')?.id);
        expect(findHeaders(root)).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
        expect(findDay(root, 'Thursday, November 12, 2026').getAttribute('aria-selected')).toBe('true');
        expect(root.querySelectorAll('[role="gridcell"]')).toHaveLength(42);
    });

    test('can\'t choose a day outside of min and max, nor show a month that is all outside of them', async () => {
        const [fixture, root] = await render(CalendarHostComponent);
        const previous: HTMLButtonElement = findButton(root, 'Previous month');
        const next: HTMLButtonElement = findButton(root, 'Next month');

        expect(findDay(root, 'Sunday, November 1, 2026').getAttribute('aria-disabled')).toBe('true');
        expect(findDay(root, 'Monday, November 2, 2026').getAttribute('aria-disabled')).toBe('false');
        expect(findDay(root, 'Monday, November 30, 2026').getAttribute('aria-disabled')).toBe('false');
        expect(findDay(root, 'Tuesday, December 1, 2026').getAttribute('aria-disabled')).toBe('true');
        expect(previous?.disabled).toBe(true);
        expect(next?.disabled).toBe(true);

        findDay(root, 'Sunday, November 1, 2026').click();
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen).toEqual([]);
    });

    test('chooses the day that is clicked, also the one that already is', async () => {
        const [fixture, root] = await render(CalendarHostComponent);

        findDay(root, 'Monday, November 16, 2026').click();
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen).toEqual([new Date(2026, 10, 16)]);

        findDay(root, 'Thursday, November 12, 2026').click();
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen).toEqual([new Date(2026, 10, 16), new Date(2026, 10, 12)]);
    });

    test('switches to the months before and after', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ firstDayOfWeek: 0 })] });
        const [fixture, root] = await render(UnboundedCalendarHostComponent);
        const previous: HTMLButtonElement = findButton(root, 'Previous month');
        const next: HTMLButtonElement = findButton(root, 'Next month');
        expect(findHeaders(root)[0]).toBe('Sunday');

        next.click();
        await fixture.whenStable();
        expect(root.querySelector('[aria-live]')?.textContent?.trim()).toBe('December 2026');
        previous.click();
        previous.click();
        await fixture.whenStable();
        expect(root.querySelector('[aria-live]')?.textContent?.trim()).toBe('October 2026');
    });

    test('colors its header in the primary color, or the one the config says', async () => {
        const [, root] = await render(UnboundedCalendarHostComponent);
        expect(getHeaderButton(root).parentElement?.classList.contains('surface-primary')).toBe(true);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: [provideInputConfig({ calendarColor: 'secondary' })] });
        const [, secondaryRoot] = await render(UnboundedCalendarHostComponent);
        expect(getHeaderButton(secondaryRoot).parentElement?.classList.contains('surface-secondary')).toBe(true);
    });

    test('jumps to a year and a month of it through the month at the top, and back to the days', async () => {
        const [fixture, root] = await render(UnboundedCalendarHostComponent);
        const header: HTMLButtonElement = getHeaderButton(root);
        expect(header.querySelector('[aria-live]')?.textContent?.trim()).toBe('November 2026');
        expect(header.querySelector('.sr-only')?.textContent).toBe(', Choose a year');
        expect(header.getAttribute('aria-expanded')).toBe('false');

        header.click();
        await fixture.whenStable();
        expect(header.getAttribute('aria-expanded')).toBe('true');
        expect(root.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('Choose a year');
        expect(findOption(root, '2026').getAttribute('aria-selected')).toBe('true');
        expect(findOption(root, '1926')).toBeDefined();
        expect(findOption(root, '2126')).toBeDefined();
        expect(root.querySelector('button[aria-label="Previous month"]')).toBeNull();

        findOption(root, '1990').click();
        await fixture.whenStable();
        expect(root.querySelector('[role="grid"]')?.getAttribute('aria-label')).toBe('1990');
        expect(root.querySelector('[aria-live]')?.textContent?.trim()).toBe('November 1990');
        expect(findOption(root, 'November').getAttribute('aria-selected')).toBe('true');

        findOption(root, 'May').click();
        await fixture.whenStable();
        expect(header.getAttribute('aria-expanded')).toBe('false');
        expect(root.querySelector('[aria-live]')?.textContent?.trim()).toBe('May 1990');
        expect(findDay(root, 'Thursday, May 17, 1990')).toBeDefined();

        // the month at the top switches back to the days without choosing anything
        header.click();
        await fixture.whenStable();
        header.click();
        await fixture.whenStable();
        expect(root.querySelector('[aria-live]')?.textContent?.trim()).toBe('May 1990');
        expect(root.querySelectorAll('[role="gridcell"]')).toHaveLength(42);
    });

    test('only offers the years of min and max, and none of their months that are all outside of them', async () => {
        const [fixture, root] = await render(CalendarHostComponent);

        getHeaderButton(root).click();
        await fixture.whenStable();
        expect(Array.from(root.querySelectorAll('[role="gridcell"]'), cell => cell.textContent?.trim())).toEqual(['2026']);

        findOption(root, '2026').click();
        await fixture.whenStable();
        expect(findOption(root, 'October').getAttribute('aria-disabled')).toBe('true');
        expect(findOption(root, 'November').getAttribute('aria-disabled')).toBe('false');
        expect(findOption(root, 'December').getAttribute('aria-disabled')).toBe('true');
        expect(fixture.componentInstance.chosen).toEqual([]);
    });
});
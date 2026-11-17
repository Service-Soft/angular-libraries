import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideInputConfig } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { provideInputTimeConfig } from './input-time-config.provider';
import { InputTimeComponent } from './input-time.component';
import { InputTimeUtilities } from './input-time.utilities';

@Component({
    selector: 'ui-time-host',
    template: '<ui-input-time label="Start" hint="Every half hour" name="start" min="08:00" max="18:00" [(value)]="start" />',
    imports: [InputTimeComponent]
})
class TimeHostComponent {
    readonly start: WritableSignal<string | undefined> = signal('09:30');
}

@Component({
    selector: 'ui-slots-host',
    template: '<ui-input-time label="Appointment" [times]="slots" [required]="false" [showValidationError]="true" [(value)]="appointment" />',
    imports: [InputTimeComponent]
})
class SlotsHostComponent {
    readonly slots: string[] = ['09:00', '10:15', '14:30'];
    readonly appointment: WritableSignal<string | undefined> = signal(undefined);
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

function findDescription(root: HTMLElement, input: HTMLInputElement): string | undefined {
    const ids: string[] = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

// jsdom has no popovers: the test setup marks an open one, and the toggle event the browser sends when the button
// opens it is sent by hand
async function openPicker(fixture: ComponentFixture<unknown>, root: HTMLElement): Promise<HTMLElement | null> {
    const picker: HTMLElement | null = root.querySelector('[popover]');
    picker?.showPopover();
    picker?.dispatchEvent(Object.assign(new Event('toggle'), { newState: 'open' }));
    await fixture.whenStable();
    return picker;
}

function findOptions(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>('[role="option"]'));
}

describe('InputTimeComponent', () => {
    test('binds the value two-way as HH:mm, as text in the language of the app', async () => {
        const [fixture, root] = await render(TimeHostComponent);
        const input: HTMLInputElement = getInput(root);
        expect(input.type).toBe('text');
        expect(input.name).toBe('start');
        expect(input.value).toMatch(/^9:30\sAM$/);
        expect(input.placeholder).toMatch(/^6:30\sPM$/);
        expect(root.querySelector('label')?.getAttribute('for')).toBe(input.id);

        await type(fixture, input, '4:30 pm');
        expect(fixture.componentInstance.start()).toBe('16:30');
        await type(fixture, input, '16');
        expect(fixture.componentInstance.start()).toBe('16:00');
        input.dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(input.value).toMatch(/^4:00\sPM$/);

        fixture.componentInstance.start.set(undefined);
        await fixture.whenStable();
        expect(input.value).toBe('');
    });

    test('checks that the text is a time within min and max on the steps from min', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ errorMessages: { stepMismatch: 'Nur halbe Stunden.' } })] });
        const [fixture, root] = await render(TimeHostComponent);
        const input: HTMLInputElement = getInput(root);
        input.dispatchEvent(new Event('blur'));

        await type(fixture, input, '25:00');
        expect(fixture.componentInstance.start()).toBeUndefined();
        expect(findDescription(root, input)).toBe('The value can\'t be read.');
        await type(fixture, input, '7:30');
        expect(findDescription(root, input)).toBe('The value is too small.');
        await type(fixture, input, '18:30');
        expect(findDescription(root, input)).toBe('The value is too large.');
        await type(fixture, input, '9:45');
        expect(input.validity.customError).toBe(true);
        expect(findDescription(root, input)).toBe('Nur halbe Stunden.');
        await type(fixture, input, '17:30');
        expect(input.checkValidity()).toBe(true);
        expect(findDescription(root, input)).toBe('Every half hour');
    });

    test('only allows its times, when it has them', async () => {
        const [fixture, root] = await render(SlotsHostComponent);
        const input: HTMLInputElement = getInput(root);
        expect(input.required).toBe(false);
        expect(input.checkValidity()).toBe(true);

        await type(fixture, input, '10:00');
        expect(findDescription(root, input)).toBe('This time isn\'t available.');
        await type(fixture, input, '10:15');
        expect(input.checkValidity()).toBe(true);
    });

    test('opens a picker of the allowed times with its button, at the time of the value', async () => {
        TestBed.configureTestingModule({ providers: [provideInputTimeConfig({ timePickerLabel: 'Uhrzeit wählen', color: 'secondary' })] });
        const [fixture, root] = await render(TimeHostComponent);
        const button: HTMLButtonElement | null = root.querySelector('button[popovertarget]');
        expect(button?.getAttribute('aria-label')).toBe('Uhrzeit wählen');
        expect(button?.getAttribute('popovertarget')).toBe(root.querySelector('[popover]')?.id);
        expect(root.querySelector('[role="listbox"]')).toBeNull();

        await openPicker(fixture, root);
        const listbox: HTMLElement | null = root.querySelector('[role="listbox"]');
        expect(root.querySelector(`#${listbox?.getAttribute('aria-labelledby') ?? ''}`)?.textContent?.trim()).toBe('Uhrzeit wählen');
        expect(listbox?.parentElement?.previousElementSibling?.classList.contains('surface-secondary')).toBe(true);
        const options: HTMLElement[] = findOptions(root);
        expect(options).toHaveLength(21);
        expect(options[0]?.textContent?.trim()).toMatch(/^8:00\sAM$/);
        const chosen: HTMLElement | undefined = options.find(option => option.getAttribute('aria-selected') === 'true');
        expect(chosen?.textContent?.trim()).toMatch(/^9:30\sAM$/);
        expect(document.activeElement).toBe(chosen);
    });

    test('chooses the time that is clicked, closes the picker and focuses the input', async () => {
        const [fixture, root] = await render(TimeHostComponent);
        const picker: HTMLElement | null = await openPicker(fixture, root);

        findOptions(root)[4]?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.start()).toBe('10:00');
        expect(getInput(root).value).toMatch(/^10:00\sAM$/);
        expect(picker?.hasAttribute('data-popover-open')).toBe(false);
        expect(document.activeElement).toBe(getInput(root));
    });

    test('chooses the time it is on with the keyboard', async () => {
        const [fixture, root] = await render(TimeHostComponent);
        await openPicker(fixture, root);
        const chosen: Element | null = document.activeElement;

        chosen?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await fixture.whenStable();
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await fixture.whenStable();
        expect(fixture.componentInstance.start()).toBe('10:00');
    });
});

describe('InputTimeUtilities', () => {
    test('reads a time in the clock of the language, with or without its minutes and AM or PM', () => {
        const usFormat: Intl.DateTimeFormat = InputTimeUtilities.resolveFormat('en-US');
        const germanFormat: Intl.DateTimeFormat = InputTimeUtilities.resolveFormat('de');
        expect(InputTimeUtilities.findTimeInText('09:30 PM', usFormat)).toBe('21:30');
        expect(InputTimeUtilities.findTimeInText('12:05am', usFormat)).toBe('00:05');
        expect(InputTimeUtilities.findTimeInText('21:30', usFormat)).toBe('21:30');
        expect(InputTimeUtilities.findTimeInText('9.30', germanFormat)).toBe('09:30');
        expect(InputTimeUtilities.findTimeInText(' 7 ', germanFormat)).toBe('07:00');
        expect(InputTimeUtilities.findTimeInText('', germanFormat)).toBeUndefined();
        expect(InputTimeUtilities.findTimeInText('24:00', germanFormat)).toBeUndefined();
        expect(InputTimeUtilities.findTimeInText('9:60', germanFormat)).toBeUndefined();
        expect(InputTimeUtilities.findTimeInText('9:30:15', germanFormat)).toBeUndefined();
        expect(InputTimeUtilities.resolveText('21:30', germanFormat)).toBe('21:30');
        // the hour as the language writes it, the same in the input and in the list of the picker
        expect(InputTimeUtilities.resolveText('09:30', germanFormat)).toBe('9:30');
        expect(InputTimeUtilities.resolveText('09:30', usFormat)).toMatch(/^9:30\sAM$/);
    });

    test('lists the times from one to another in steps, with the last one when the steps reach it', () => {
        expect(InputTimeUtilities.resolveTimes('08:00', '10:00', 30)).toEqual(['08:00', '08:30', '09:00', '09:30', '10:00']);
        expect(InputTimeUtilities.resolveTimes('08:00', '09:45', 60)).toEqual(['08:00', '09:00']);
        expect(InputTimeUtilities.resolveTimes('18:00', '08:00', 60)).toEqual([]);
        expect(InputTimeUtilities.resolveMinutes('09:30')).toBe(570);
        expect(InputTimeUtilities.getTime(new Date(2026, 10, 12, 7, 5))).toBe('07:05');
    });
});
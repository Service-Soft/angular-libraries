import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputOption } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { InputChipsComponent, InputChipsCustomValue } from './input-chips.component';

const TAGS: InputOption<string>[] = [
    { label: 'Angular', value: 'angular' },
    { label: 'Accessibility', value: 'a11y' },
    { label: 'Testing', value: 'testing' }
];

@Component({
    selector: 'ui-host',
    template: '<ui-input-chips label="Tags" hint="Choose a few" [options]="tags" [customValue]="toTag" [(value)]="chosen" />',
    imports: [InputChipsComponent]
})
class HostComponent {
    readonly tags: InputOption<string>[] = TAGS;
    readonly chosen: WritableSignal<string[]> = signal(['angular']);
    readonly toTag: InputChipsCustomValue<string> = text => /\d/.test(text) ? undefined : text.toLowerCase();
}

@Component({
    selector: 'ui-read-only-host',
    template: '<ui-input-chips label="Tags" readonly [options]="tags" [value]="chosen" />',
    imports: [InputChipsComponent]
})
class ReadOnlyHostComponent {
    readonly tags: InputOption<string>[] = TAGS;
    readonly chosen: string[] = ['angular', 'testing'];
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
    input.dispatchEvent(new InputEvent('input', { inputType: 'insertText' }));
    await fixture.whenStable();
}

function findChips(root: HTMLElement): string[] {
    return [...root.querySelectorAll('li span')].map(chip => chip.textContent?.trim() ?? '');
}

function findOptions(root: HTMLElement): string[] {
    return [...root.querySelectorAll('[role="option"]')].map(option => option.textContent?.trim() ?? '');
}

function findDescription(root: HTMLElement, element: HTMLElement): string | undefined {
    const ids: string[] = element.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

describe('InputChipsComponent', () => {
    test('shows the chosen values as chips, labelled by their options, above a combobox', async () => {
        const [, root] = await render(HostComponent);
        const input: HTMLInputElement = getInput(root);

        expect(findChips(root)).toEqual(['Angular']);
        expect(input.getAttribute('role')).toBe('combobox');
        expect(root.querySelector('label')?.getAttribute('for')).toBe(input.id);
        expect(findDescription(root, input)).toBe('Choose a few');
    });

    test('adds a clicked option, keeps the list open for more, and removes a chip with its button', async () => {
        const [fixture, root] = await render(HostComponent);
        const input: HTMLInputElement = getInput(root);

        // the text hides the chosen Angular, which stays chosen
        await type(fixture, input, 'test');
        expect(findOptions(root)).toEqual(['Testing']);
        expect(fixture.componentInstance.chosen()).toEqual(['angular']);
        root.querySelector<HTMLElement>('[role="option"]')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual(['angular', 'testing']);
        expect(input.value).toBe('');
        expect(findChips(root)).toEqual(['Angular', 'Testing']);

        const remove: HTMLButtonElement | undefined = root.querySelector<HTMLButtonElement>('li button') ?? undefined;
        expect(remove?.getAttribute('aria-label')).toBe('Remove');
        expect(remove == undefined ? undefined : findDescription(root, remove)).toBe('Angular');
        remove?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual(['testing']);
        // the button went with its chip, the text next to the chips has the focus
        expect(document.activeElement).toBe(input);
    });

    test('shows the chips inside the box of the field, before the text, and removes the last one with Backspace', async () => {
        const [fixture, root] = await render(HostComponent);
        const input: HTMLInputElement = getInput(root);
        fixture.componentInstance.chosen.set(['angular', 'testing']);
        await fixture.whenStable();
        expect(input.parentElement?.firstElementChild?.tagName).toBe('UL');

        // a text is deleted letter by letter first
        await type(fixture, input, 'a');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual(['angular', 'testing']);

        await type(fixture, input, '');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual(['angular']);
        expect(findChips(root)).toEqual(['Angular']);
    });

    test('takes a text that is no option with Enter, once, instead of submitting the form', async () => {
        const [fixture, root] = await render(HostComponent);
        const input: HTMLInputElement = getInput(root);

        await type(fixture, input, 'Signals');
        expect(findOptions(root)).toEqual([]);
        const enter: KeyboardEvent = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
        input.dispatchEvent(enter);
        await fixture.whenStable();
        expect(enter.defaultPrevented).toBe(true);
        expect(fixture.componentInstance.chosen()).toEqual(['angular', 'signals']);
        expect(findChips(root)).toEqual(['Angular', 'signals']);
        expect(input.value).toBe('');

        await type(fixture, input, 'signals');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual(['angular', 'signals']);
    });

    test('keeps a text customValue turns into no value, to correct it', async () => {
        const [fixture, root] = await render(HostComponent);
        const input: HTMLInputElement = getInput(root);

        await type(fixture, input, 'Angular 22');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual(['angular']);
        expect(input.value).toBe('Angular 22');
    });

    test('needs a value while required, and lists its chips without buttons or a field to type in while read only', async () => {
        const [fixture, root] = await render(HostComponent);
        fixture.componentInstance.chosen.set([]);
        await fixture.whenStable();
        expect(getInput(root).checkValidity()).toBe(false);
        expect(getComputedStyle(getInput(root)).display).not.toBe('none');

        const [, readOnly] = await render(ReadOnlyHostComponent);
        expect(findChips(readOnly)).toEqual(['Angular', 'Testing']);
        expect(readOnly.querySelectorAll('li button')).toHaveLength(0);
        expect(getComputedStyle(getInput(readOnly)).display).toBe('none');
    });
});
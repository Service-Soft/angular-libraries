import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputOption } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { InputAutocompleteComponent } from './input-autocomplete.component';

/**
 * A city of the options, an object like the rows of an api.
 */
type City = {
    /**
     * Its code.
     */
    code: string
};

const BERLIN: City = { code: 'BER' };
const BREMEN: City = { code: 'BRE' };
const HAMBURG: City = { code: 'HAM' };

const CITIES: InputOption<City>[] = [
    { label: 'Berlin', value: BERLIN },
    { label: 'Bremen', value: BREMEN },
    { label: 'Hamburg', value: HAMBURG }
];

@Component({
    selector: 'ui-host',
    template: '<ui-input-autocomplete label="City" hint="Type to find it" [options]="cities" [(value)]="city" [(query)]="query" />',
    imports: [InputAutocompleteComponent]
})
class HostComponent {
    readonly cities: InputOption<City>[] = CITIES;
    readonly city: WritableSignal<City | undefined> = signal(undefined);
    readonly query: WritableSignal<string> = signal('');
}

async function render(): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
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

function findOptions(root: HTMLElement): string[] {
    return [...root.querySelectorAll('[role="option"]')].map(option => option.textContent?.trim() ?? '');
}

function findDescription(root: HTMLElement, input: HTMLInputElement): string | undefined {
    const ids: string[] = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

describe('InputAutocompleteComponent', () => {
    test('is a combobox, labelled and described by its hint, with the list closed', async () => {
        const [, root] = await render();
        const input: HTMLInputElement = getInput(root);

        expect(input.getAttribute('role')).toBe('combobox');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(input.autocomplete).toBe('off');
        expect(root.querySelector('label')?.getAttribute('for')).toBe(input.id);
        expect(findDescription(root, input)).toBe('Type to find it');
        expect(findOptions(root)).toEqual([]);
    });

    test('shows the options that contain the text, and takes a clicked one as the value with its label', async () => {
        const [fixture, root] = await render();
        const input: HTMLInputElement = getInput(root);

        await type(fixture, input, 'b');
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(findOptions(root)).toEqual(['Berlin', 'Bremen', 'Hamburg']);

        await type(fixture, input, 'bre');
        expect(findOptions(root)).toEqual(['Bremen']);
        expect(fixture.componentInstance.query()).toBe('bre');

        root.querySelector<HTMLElement>('[role="option"]')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.city()).toBe(BREMEN);
        expect(input.value).toBe('Bremen');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    test('shows the label of a value set from code, and loses the value once the text is changed', async () => {
        const [fixture, root] = await render();
        const input: HTMLInputElement = getInput(root);

        fixture.componentInstance.city.set(HAMBURG);
        await fixture.whenStable();
        expect(input.value).toBe('Hamburg');
        expect(input.checkValidity()).toBe(true);

        await type(fixture, input, 'Ham');
        expect(fixture.componentInstance.city()).toBeUndefined();
    });

    test('is invalid while the text is none of the options', async () => {
        const [fixture, root] = await render();
        const input: HTMLInputElement = getInput(root);
        expect(input.checkValidity()).toBe(false);

        await type(fixture, input, 'Paris');
        input.dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(input.validity.customError).toBe(true);
        expect(findDescription(root, input)).toBe('Choose one of the options.');
    });
});
@Component({
    selector: 'ui-free-text-host',
    template: '<ui-input-autocomplete label="City" freeText [options]="cities" [(query)]="city" />',
    imports: [InputAutocompleteComponent]
})
class FreeTextHostComponent {
    readonly cities: InputOption<string>[] = ['Berlin', 'Bremen'].map(city => ({ label: city, value: city }));
    readonly city: WritableSignal<string> = signal('');
}

describe('InputAutocompleteComponent with freeText', () => {
    test('takes any text, and suggests the options that contain it', async () => {
        const fixture: ComponentFixture<FreeTextHostComponent> = TestBed.createComponent(FreeTextHostComponent);
        await fixture.whenStable();
        const root: HTMLElement = fixture.nativeElement as HTMLElement;
        const input: HTMLInputElement = getInput(root);

        await type(fixture, input, 'Paris');
        expect(fixture.componentInstance.city()).toBe('Paris');
        expect(input.checkValidity()).toBe(true);

        await type(fixture, input, 'Br');
        expect(findOptions(root)).toEqual(['Bremen']);
    });
});
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputOption, InputValidation, provideInputConfig } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { InputSelectComponent } from './input-select.component';

/**
 * A country of the options, an object like the rows of an api.
 */
type Country = {
    /**
     * Its code.
     */
    code: string
};

const GERMANY: Country = { code: 'DE' };
const FRANCE: Country = { code: 'FR' };
const SPAIN: Country = { code: 'ES' };

const COUNTRIES: InputOption<Country>[] = [
    { label: 'Germany', value: GERMANY },
    { label: 'France', value: FRANCE },
    { label: 'Spain', value: SPAIN, disabled: true }
];

@Component({
    selector: 'ui-two-way-host',
    template: '<ui-input-select label="Country" hint="Where you live" placeholder="Choose a country" [options]="countries" [(value)]="country" />',
    imports: [InputSelectComponent]
})
class TwoWayHostComponent {
    readonly countries: InputOption<Country>[] = COUNTRIES;
    readonly country: WritableSignal<Country | undefined> = signal(FRANCE);
}

@Component({
    selector: 'ui-optional-host',
    template: `
        <ui-input-select label="Country" name="country" placeholder="None" [required]="false" [options]="countries" [(value)]="country" />
    `,
    imports: [InputSelectComponent]
})
class OptionalHostComponent {
    readonly countries: InputOption<Country>[] = COUNTRIES;
    readonly country: WritableSignal<Country | undefined> = signal(undefined);
}

@Component({
    selector: 'ui-read-only-host',
    template: '<ui-input-select label="Country" readonly [options]="countries" [(value)]="country" />',
    imports: [InputSelectComponent]
})
class ReadOnlyHostComponent {
    readonly countries: InputOption<Country>[] = COUNTRIES;
    readonly country: WritableSignal<Country | undefined> = signal(GERMANY);
}

@Component({
    selector: 'ui-custom-validation-host',
    template: '<ui-input-select label="Country" [options]="countries" [customValidation]="validateShipping" [(value)]="country" />',
    imports: [InputSelectComponent]
})
class CustomValidationHostComponent {
    readonly countries: InputOption<Country>[] = COUNTRIES;
    readonly country: WritableSignal<Country | undefined> = signal(GERMANY);
    readonly validateShipping: InputValidation<Country | undefined> = value => value === FRANCE ? 'We don\'t ship there yet.' : undefined;
}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getElement<E extends Element>(root: HTMLElement, selector: string): E {
    const element: E | undefined = root.querySelector<E>(selector) ?? undefined;
    if (element == undefined) {
        throw new Error(`${selector} did not render.`);
    }
    return element;
}

function getCombobox(root: HTMLElement): HTMLElement {
    return getElement(root, '[role="combobox"]');
}

function getSelect(root: HTMLElement): HTMLSelectElement {
    return getElement(root, 'select');
}

function findOptions(root: HTMLElement): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>('[role="option"]')];
}

async function chooseInList(fixture: ComponentFixture<unknown>, root: HTMLElement, label: string): Promise<void> {
    getCombobox(root).click();
    await fixture.whenStable();
    findOptions(root).find(option => option.textContent?.trim() === label)
        ?.click();
    await fixture.whenStable();
}

function findDescription(root: HTMLElement, element: HTMLElement): string | undefined {
    const ids: string[] = element.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

describe('InputSelectComponent', () => {
    test('binds the value two-way, by the identity of the values of its options', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const combobox: HTMLElement = getCombobox(root);
        expect(combobox.textContent?.trim()).toBe('France');

        await chooseInList(fixture, root, 'Germany');
        expect(fixture.componentInstance.country()).toBe(GERMANY);
        expect(combobox.textContent?.trim()).toBe('Germany');
        expect(combobox.getAttribute('aria-expanded')).toBe('false');

        fixture.componentInstance.country.set(FRANCE);
        await fixture.whenStable();
        expect(combobox.textContent?.trim()).toBe('France');
        expect(getSelect(root).selectedOptions[0]?.textContent?.trim()).toBe('France');

        // a value that is no option shows the placeholder
        fixture.componentInstance.country.set({ code: 'DE' });
        await fixture.whenStable();
        expect(combobox.textContent?.trim()).toBe('Choose a country');
        expect(getSelect(root).selectedIndex).toBe(0);
    });

    test('is a combobox labelled by its label and described by its hint, that opens the options on click', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const combobox: HTMLElement = getCombobox(root);
        const label: HTMLLabelElement = getElement(root, 'label');

        expect(combobox.getAttribute('aria-labelledby')).toBe(label.id);
        expect(combobox.getAttribute('aria-required')).toBe('true');
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
        expect(findDescription(root, combobox)).toBe('Where you live');
        expect(findOptions(root)).toEqual([]);

        combobox.click();
        await fixture.whenStable();
        expect(combobox.getAttribute('aria-expanded')).toBe('true');
        // a required select has no empty option to go back to
        expect(findOptions(root).map(option => option.textContent?.trim())).toEqual(['Germany', 'France', 'Spain']);
        expect(findOptions(root).map(option => option.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
        expect(findOptions(root)[2]?.getAttribute('aria-disabled')).toBe('true');
    });

    test('hands focus from the native select, which the label and a form focus, on to the combobox', async () => {
        const [, root] = await render(TwoWayHostComponent);
        const select: HTMLSelectElement = getSelect(root);

        expect(getElement<HTMLLabelElement>(root, 'label').htmlFor).toBe(select.id);
        expect(select.getAttribute('aria-hidden')).toBe('true');
        select.focus();
        expect(document.activeElement).toBe(getCombobox(root));
    });

    test('takes the option the browser autofills into the native select', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const select: HTMLSelectElement = getSelect(root);

        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change'));
        await fixture.whenStable();
        expect(fixture.componentInstance.country()).toBe(GERMANY);
    });

    test('can be emptied again with the placeholder when it is optional, and is valid empty', async () => {
        const [fixture, root] = await render(OptionalHostComponent);
        const select: HTMLSelectElement = getSelect(root);
        expect(select.name).toBe('country');
        expect(select.checkValidity()).toBe(true);

        await chooseInList(fixture, root, 'France');
        expect(fixture.componentInstance.country()).toBe(FRANCE);
        expect(select.value).toBe('1');

        await chooseInList(fixture, root, 'None');
        expect(fixture.componentInstance.country()).toBeUndefined();
        expect(select.value).toBe('');
    });

    test('shows that a value is missing once the user left it, and instead of the popup of the browser', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ errorMessages: { valueMissing: 'Pflichtfeld.' } })] });
        const [fixture, root] = await render(TwoWayHostComponent);
        fixture.componentInstance.country.set(undefined);
        await fixture.whenStable();
        const select: HTMLSelectElement = getSelect(root);
        const combobox: HTMLElement = getCombobox(root);
        expect(select.checkValidity()).toBe(false);
        expect(combobox.hasAttribute('aria-invalid')).toBe(false);

        const invalid: Event = new Event('invalid', { cancelable: true });
        select.dispatchEvent(invalid);
        await fixture.whenStable();
        expect(invalid.defaultPrevented).toBe(true);
        expect(combobox.getAttribute('aria-invalid')).toBe('true');
        expect(findDescription(root, combobox)).toBe('Pflichtfeld.');
    });

    test('keeps its value while read only, and can still be focused and submitted', async () => {
        const [fixture, root] = await render(ReadOnlyHostComponent);
        const select: HTMLSelectElement = getSelect(root);
        const combobox: HTMLElement = getCombobox(root);

        combobox.click();
        await fixture.whenStable();
        expect(combobox.getAttribute('aria-expanded')).toBe('false');
        expect(combobox.getAttribute('aria-readonly')).toBe('true');
        expect(combobox.tabIndex).toBe(0);
        expect(select.disabled).toBe(false);
        expect([...select.options].map(option => option.disabled)).toEqual([true, false, true, true]);
        expect([...combobox.classList]).toContain('bg-surface-container');
    });

    test('validates with customValidation and makes the native select invalid', async () => {
        const [fixture, root] = await render(CustomValidationHostComponent);
        const select: HTMLSelectElement = getSelect(root);
        expect(select.checkValidity()).toBe(true);
        expect([...getCombobox(root).classList]).toContain('bg-surface');

        await chooseInList(fixture, root, 'France');
        expect(select.validity.customError).toBe(true);
        expect(findDescription(root, getCombobox(root))).toBe('We don\'t ship there yet.');
    });
});
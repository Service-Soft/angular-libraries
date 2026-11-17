import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { ExtraOption } from './extra-option.model';
import { provideInputExtrasConfig } from './input-extras-config.provider';
import { InputExtrasComponent } from './input-extras.component';
import { SelectedExtra } from './selected-extra.model';

const EXTRAS: ExtraOption[] = [
    { id: 'breakfast', label: 'Breakfast', description: 'Buffet from 7 to 10', price: 1500, unit: 'perDay', type: 'toggle' },
    { id: 'cleaning', label: 'Final cleaning', price: 4000, unit: 'once', type: 'toggle', disabled: true },
    { id: 'bike', label: 'Bike', price: 1200, unit: 'perDay', type: 'quantity', max: 3 },
    { id: 'towels', label: 'Towels', price: 300, unit: 'perItem', type: 'quantity' }
];

@Component({
    selector: 'ngx-extras-host',
    template: `
        <ngx-input-extras label="Extras" hint="You can add more at the reception" showTotal [days]="3" [options]="extras" [(value)]="chosen" />
    `,
    imports: [InputExtrasComponent]
})
class ExtrasHostComponent {
    readonly extras: ExtraOption[] = EXTRAS;
    readonly chosen: WritableSignal<SelectedExtra[]> = signal([{ id: 'towels', quantity: 2 }]);
}

@Component({
    selector: 'ngx-required-host',
    template: '<ngx-input-extras label="Extras" required appearance="switch" [showValidationError]="true" [options]="extras" />',
    imports: [InputExtrasComponent]
})
class RequiredHostComponent {
    readonly extras: ExtraOption[] = EXTRAS;
}

@Component({
    selector: 'ngx-min-host',
    template: '<ngx-input-extras label="Extras" [showValidationError]="true" [options]="extras" [(value)]="chosen" />',
    imports: [InputExtrasComponent]
})
class MinHostComponent {
    readonly extras: ExtraOption[] = [{ id: 'kayak', label: 'Kayak', price: 3500, unit: 'perDay', type: 'quantity', min: 2, max: 4 }];
    readonly chosen: WritableSignal<SelectedExtra[]> = signal([]);
}

@Component({
    selector: 'ngx-disabled-host',
    template: '<ngx-input-extras label="Extras" disabled [options]="extras" />',
    imports: [InputExtrasComponent]
})
class DisabledHostComponent {
    readonly extras: ExtraOption[] = EXTRAS;
}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getElement<T extends Element>(root: ParentNode, selector: string): T {
    const element: T | null = root.querySelector<T>(selector);
    if (element == undefined) {
        throw new Error(`Nothing matches ${selector}.`);
    }
    return element;
}

// Intl puts non-breaking spaces into some formats, like the one before € in German
function normalize(text: string | null | undefined): string {
    return text?.replaceAll(/\s+/g, ' ').trim() ?? '';
}

// what screen readers read for a native element: the texts of the ids it points to.
function resolveReferencedText(root: HTMLElement, element: Element, attribute: string): string {
    const ids: string[] = element.getAttribute(attribute)?.split(' ') ?? [];
    return ids.map(id => normalize(root.querySelector(`#${CSS.escape(id)}`)?.textContent)).join(' | ');
}

describe('InputExtrasComponent', () => {
    test('switches extras on, counts others and sums them up for the days of the booking', async () => {
        const [fixture, root] = await render(ExtrasHostComponent);
        const breakfast: HTMLInputElement = getElement(root, 'input[type="checkbox"]');
        const bike: HTMLInputElement = getElement(root, 'input[data-option-id="bike"]');
        const towels: HTMLInputElement = getElement(root, 'input[data-option-id="towels"]');

        expect(normalize(root.querySelector('legend')?.textContent)).toBe('Extras');
        expect(resolveReferencedText(root, breakfast, 'aria-labelledby')).toBe('Breakfast');
        expect(resolveReferencedText(root, breakfast, 'aria-describedby')).toBe('Buffet from 7 to 10 | €15.00 per day');
        expect(resolveReferencedText(root, bike, 'aria-labelledby')).toBe('Bike');
        expect(towels.value).toBe('2');
        // an extra that isn't chosen reads as a quantity of 0, and stays out of the value
        expect(bike.value).toBe('0');
        // a sold out extra can't be chosen
        expect(root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[1]?.disabled).toBe(true);

        breakfast.click();
        getElement<HTMLButtonElement>(root, 'button[aria-label="Add one: Bike"]').click();
        getElement<HTMLButtonElement>(root, 'button[aria-label="Add one: Bike"]').click();
        getElement<HTMLButtonElement>(root, 'button[aria-label="Remove one: Towels"]').click();
        await fixture.whenStable();

        expect(fixture.componentInstance.chosen()).toEqual([
            { id: 'breakfast', quantity: 1 },
            { id: 'bike', quantity: 2 },
            { id: 'towels', quantity: 1 }
        ]);
        expect(bike.value).toBe('2');
        expect(breakfast.closest('label')?.dataset['selected']).toBe('true');
        // 3 days of breakfast, 2 bikes for 3 days and 1 towel
        expect(normalize(root.querySelector('p[aria-live="polite"] span:last-child')?.textContent)).toBe('€120.00');
    });

    test('takes a typed quantity, which the browser checks against the max of the extra', async () => {
        const [fixture, root] = await render(ExtrasHostComponent);
        const bike: HTMLInputElement = getElement(root, 'input[data-option-id="bike"]');

        bike.value = '3';
        bike.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual([{ id: 'bike', quantity: 3 }, { id: 'towels', quantity: 2 }]);
        expect(getElement<HTMLButtonElement>(root, 'button[aria-label="Add one: Bike"]').disabled).toBe(true);

        bike.value = '5';
        bike.dispatchEvent(new Event('input'));
        bike.dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(bike.validity.rangeOverflow).toBe(true);
        expect(bike.getAttribute('aria-invalid')).toBe('true');
        expect(resolveReferencedText(root, bike, 'aria-describedby')).toBe('€12.00 per day | The value is too large.');

        // an empty quantity is none of it, and stays empty while the user types the next one
        bike.value = '';
        bike.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual([{ id: 'towels', quantity: 2 }]);
        expect(bike.value).toBe('');
    });

    test('takes the min as the least quantity once chosen, while 0 is never invalid', async () => {
        const [fixture, root] = await render(MinHostComponent);
        const kayak: HTMLInputElement = getElement(root, 'input[data-option-id="kayak"]');
        const add: HTMLButtonElement = getElement(root, 'button[aria-label="Add one: Kayak"]');
        const remove: HTMLButtonElement = getElement(root, 'button[aria-label="Remove one: Kayak"]');

        expect(kayak.value).toBe('0');
        expect(kayak.validity.valid).toBe(true);
        expect(kayak.getAttribute('aria-invalid')).toBeNull();
        expect(remove.disabled).toBe(true);

        add.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual([{ id: 'kayak', quantity: 2 }]);
        expect(kayak.value).toBe('2');

        remove.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual([]);
        expect(kayak.value).toBe('0');

        // only a quantity between 0 and the min is too small
        kayak.value = '1';
        kayak.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(kayak.validity.rangeUnderflow).toBe(true);
        expect(resolveReferencedText(root, kayak, 'aria-describedby')).toBe('€35.00 per day | The value is too small.');

        kayak.value = '0';
        kayak.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(kayak.validity.valid).toBe(true);
        expect(fixture.componentInstance.chosen()).toEqual([]);
    });

    test('marks a disabled quantity as a disabled group, so its dimmed texts belong to something disabled', async () => {
        const [, root] = await render(DisabledHostComponent);
        const group: HTMLElement = getElement(root, '[role="group"]');

        expect(resolveReferencedText(root, group, 'aria-labelledby')).toBe('Bike');
        expect(group.getAttribute('aria-disabled')).toBe('true');
        expect(getElement<HTMLInputElement>(group, 'input').disabled).toBe(true);
        expect([...group.querySelectorAll('button')].every(button => button.disabled)).toBe(true);
    });

    test('needs one extra when required, which the fieldset says', async () => {
        TestBed.configureTestingModule({ providers: [provideInputExtrasConfig({ labels: { units: { perDay: 'a day' } } })] });
        const [, root] = await render(RequiredHostComponent);
        const fieldset: HTMLFieldSetElement = getElement(root, 'fieldset');

        expect(resolveReferencedText(root, fieldset, 'aria-describedby')).toBe('This field is required.');
        expect(getElement(root, 'input[type="checkbox"]').getAttribute('role')).toBe('switch');
        expect(normalize(root.querySelector('[id$="-price"]')?.textContent)).toBe('€15.00 a day');
        // the units left out keep their defaults
        expect(normalize(root.querySelectorAll('[id$="-price"]')[3]?.textContent)).toBe('€3.00 each');
    });
});
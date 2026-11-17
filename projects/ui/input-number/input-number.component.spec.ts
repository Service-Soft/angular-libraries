import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputStringComponent } from '@service-soft/ui/input-string';
import { describe, expect, test } from 'vitest';

import { InputNumberValidation } from './input-number-validation.type';
import { InputNumberComponent } from './input-number.component';

@Component({
    selector: 'ui-two-way-host',
    template: '<ui-input-number label="Age" hint="In years" [(value)]="age" />',
    imports: [InputNumberComponent]
})
class TwoWayHostComponent {
    readonly age: WritableSignal<number | undefined> = signal(42);
}

@Component({
    selector: 'ui-attributes-host',
    template: `
        <ui-input-string label="Name" />
        <ui-input-number label="Amount" name="amount" placeholder="10" autocomplete="transaction-amount" [min]="1" [max]="99" [step]="0.5" />
        <ui-input-number label="Guests" [required]="false" disabled />
    `,
    imports: [InputNumberComponent, InputStringComponent]
})
class AttributesHostComponent {}

@Component({
    selector: 'ui-validation-host',
    template: `
        <ui-input-number label="Guests" [min]="1" [max]="10" [customValidation]="validateEven" [showValidationError]="true" [(value)]="guests" />
    `,
    imports: [InputNumberComponent]
})
class ValidationHostComponent {
    readonly guests: WritableSignal<number | undefined> = signal(undefined);
    readonly validated: (number | undefined)[] = [];
    readonly validateEven: InputNumberValidation = value => {
        this.validated.push(value);
        return value == undefined || value % 2 === 0 ? undefined : 'The number has to be even.';
    };
}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getInput(root: HTMLElement, index: number = 0): HTMLInputElement {
    const input: HTMLInputElement | undefined = root.querySelectorAll('input')[index];
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

describe('InputNumberComponent', () => {
    test('binds the value two-way as a number, undefined while empty', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const input: HTMLInputElement = getInput(root);
        expect(input.type).toBe('number');
        expect(input.value).toBe('42');

        await type(fixture, input, '7.5');
        expect(fixture.componentInstance.age()).toBe(7.5);

        await type(fixture, input, '');
        expect(fixture.componentInstance.age()).toBeUndefined();

        fixture.componentInstance.age.set(3);
        await fixture.whenStable();
        expect(input.value).toBe('3');

        fixture.componentInstance.age.set(undefined);
        await fixture.whenStable();
        expect(input.value).toBe('');
    });

    test('is labelled and described by its hint, and passes its inputs on to the native input', async () => {
        const [, root] = await render(AttributesHostComponent);
        const amount: HTMLInputElement = getInput(root, 1);
        const guests: HTMLInputElement = getInput(root, 2);

        expect(root.querySelectorAll('label')[1]?.getAttribute('for')).toBe(amount.id);
        // unique next to the other inputs, whose ids are counted separately
        expect(new Set([getInput(root).id, amount.id, guests.id]).size).toBe(3);
        expect(amount.name).toBe('amount');
        expect(amount.placeholder).toBe('10');
        expect(amount.autocomplete).toBe('transaction-amount');
        expect([amount.min, amount.max, amount.step]).toEqual(['1', '99', '0.5']);
        expect(amount.required).toBe(true);
        expect(guests.required).toBe(false);
        expect(guests.disabled).toBe(true);
    });

    test('validates the range of a value set from code, then customValidation, and blocks the form', async () => {
        const [fixture, root] = await render(ValidationHostComponent);
        const input: HTMLInputElement = getInput(root);
        expect(findDescription(root, input)).toBe('This field is required.');
        expect(fixture.componentInstance.validated).toContain(undefined);

        fixture.componentInstance.guests.set(0);
        await fixture.whenStable();
        expect(input.checkValidity()).toBe(false);
        expect(findDescription(root, input)).toBe('The value is too small.');

        fixture.componentInstance.guests.set(12);
        await fixture.whenStable();
        expect(findDescription(root, input)).toBe('The value is too large.');

        fixture.componentInstance.guests.set(3);
        await fixture.whenStable();
        expect(input.checkValidity()).toBe(false);
        expect(findDescription(root, input)).toBe('The number has to be even.');

        fixture.componentInstance.guests.set(4);
        await fixture.whenStable();
        expect(input.checkValidity()).toBe(true);
        expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    test('allows only whole numbers unless step says otherwise, like the native input', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const input: HTMLInputElement = getInput(root);
        await type(fixture, input, '1.5');
        input.dispatchEvent(new Event('blur'));
        await fixture.whenStable();

        expect(input.checkValidity()).toBe(false);
        expect(findDescription(root, input)).toBe('The value is not one of the allowed steps.');
    });

    test('shows its error instead of the popup of the browser', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const input: HTMLInputElement = getInput(root);
        await type(fixture, input, '');

        const invalid: Event = new Event('invalid', { cancelable: true });
        input.dispatchEvent(invalid);
        await fixture.whenStable();
        expect(invalid.defaultPrevented).toBe(true);
        expect(findDescription(root, input)).toBe('This field is required.');
    });
});
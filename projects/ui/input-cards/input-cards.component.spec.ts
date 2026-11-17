import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideInputConfig } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { InputCardMetaDirective } from './input-card-meta.directive';
import { InputCardOption } from './input-card-option.model';
import { InputCardsMultipleComponent } from './input-cards-multiple.component';
import { InputCardsComponent } from './input-cards.component';

type Car = {
    model: string,
    price: number
};

const GOLF: Car = { model: 'Golf', price: 39 };
const PASSAT: Car = { model: 'Passat', price: 59 };
const TRANSPORTER: Car = { model: 'Transporter', price: 89 };

const CARS: InputCardOption<Car>[] = [
    { label: 'VW Golf', value: GOLF, description: 'Compact, 5 seats', image: { url: '/golf.jpg', width: 640, height: 360 } },
    { label: 'VW Passat', value: PASSAT, description: 'SUV, 5 seats' },
    { label: 'VW Transporter', value: TRANSPORTER, disabled: true }
];

const EXTRAS: InputCardOption<string>[] = [
    { label: 'Child seat', value: 'child-seat' },
    { label: 'Snow chains', value: 'snow-chains' },
    { label: 'Second driver', value: 'second-driver' }
];

@Component({
    selector: 'ui-cars-host',
    template: `
        <ui-input-cards label="Car" hint="You can change it until the pick-up" name="car" [options]="cars" [(value)]="car">
            <ng-template let-car [uiInputCardMeta]="cars">{{ car.value.price }} € a day</ng-template>
        </ui-input-cards>
    `,
    imports: [InputCardsComponent, InputCardMetaDirective]
})
class CarsHostComponent {
    readonly cars: InputCardOption<Car>[] = CARS;
    readonly car: WritableSignal<Car | undefined> = signal(undefined);
}

@Component({
    selector: 'ui-readonly-host',
    template: '<ui-input-cards label="Car" readonly [options]="cars" [(value)]="car" />',
    imports: [InputCardsComponent]
})
class ReadonlyHostComponent {
    readonly cars: InputCardOption<Car>[] = CARS;
    readonly car: WritableSignal<Car | undefined> = signal(GOLF);
}

@Component({
    selector: 'ui-sizes-host',
    template: '<ui-input-cards label="Size" appearance="segmented" [options]="sizes" [(value)]="size" />',
    imports: [InputCardsComponent]
})
class SizesHostComponent {
    readonly sizes: InputCardOption<string>[] = [{ label: 'S', value: 's' }, { label: 'M', value: 'm' }, { label: 'L', value: 'l', disabled: true }];
    readonly size: WritableSignal<string | undefined> = signal('m');
}

@Component({
    selector: 'ui-extras-host',
    template: '<ui-input-cards-multiple label="Extras" [options]="extras" [(value)]="chosen" />',
    imports: [InputCardsMultipleComponent]
})
class ExtrasHostComponent {
    readonly extras: InputCardOption<string>[] = EXTRAS;
    readonly chosen: WritableSignal<string[]> = signal([]);
}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findInputs(root: HTMLElement): HTMLInputElement[] {
    return [...root.querySelectorAll<HTMLInputElement>('input')];
}

function findText(root: HTMLElement, ids: string | null | undefined): string | undefined {
    return ids?.split(' ').map(id => root.querySelector(`#${id}`)?.textContent.trim())
        .join(' ');
}

async function dispatchInvalid(fixture: ComponentFixture<unknown>, input: HTMLInputElement | undefined): Promise<Event> {
    const invalid: Event = new Event('invalid', { cancelable: true });
    input?.dispatchEvent(invalid);
    await fixture.whenStable();
    return invalid;
}

describe('InputCardsComponent', () => {
    test('is a group of radio buttons, each named by its title and described by the rest of its card', async () => {
        const [, root] = await render(CarsHostComponent);
        const radios: HTMLInputElement[] = findInputs(root);
        const fieldset: HTMLFieldSetElement | null = root.querySelector('fieldset');

        // the star of a required input stands apart from the label
        expect(fieldset?.querySelector('legend')?.textContent).toBe('Car *');
        expect(findText(root, fieldset?.getAttribute('aria-describedby'))).toBe('You can change it until the pick-up');
        expect(radios.map(radio => radio.type)).toEqual(['radio', 'radio', 'radio']);
        expect(radios.map(radio => radio.name)).toEqual(['car', 'car', 'car']);
        expect(radios.map(radio => findText(root, radio.getAttribute('aria-labelledby')))).toEqual(['VW Golf', 'VW Passat', 'VW Transporter']);
        expect(findText(root, radios[0]?.getAttribute('aria-describedby'))).toBe('Compact, 5 seats 39 € a day');
        expect(findText(root, radios[2]?.getAttribute('aria-describedby'))).toBe('89 € a day');
        expect(radios[2]?.disabled).toBe(true);
        expect(radios[0]?.closest('label')?.querySelector('img')
            ?.getAttribute('alt')).toBe('');
    });

    test('binds the value two-way, also when the card around a radio button is clicked', async () => {
        const [fixture, root] = await render(CarsHostComponent);
        const radios: HTMLInputElement[] = findInputs(root);

        radios[1]?.closest('label')?.querySelector<HTMLElement>('.text-body-sm')
            ?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.car()).toBe(PASSAT);
        expect(radios[1]?.checked).toBe(true);

        fixture.componentInstance.car.set(GOLF);
        await fixture.whenStable();
        expect(radios.map(radio => radio.checked)).toEqual([true, false, false]);
    });

    test('needs a choice by default, and shows it instead of the popup of the browser', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ errorMessages: { valueMissing: 'Bitte wählen.' } })] });
        const [fixture, root] = await render(CarsHostComponent);
        const radios: HTMLInputElement[] = findInputs(root);
        expect(radios[1]?.checkValidity()).toBe(false);

        const invalid: Event = await dispatchInvalid(fixture, radios[0]);
        expect(invalid.defaultPrevented).toBe(true);
        expect(radios[0]?.getAttribute('aria-invalid')).toBe('true');
        expect(findText(root, root.querySelector('fieldset')?.getAttribute('aria-describedby'))).toBe('Bitte wählen.');

        radios[1]?.click();
        await fixture.whenStable();
        expect(radios[0]?.checkValidity()).toBe(true);
        expect(radios[0]?.hasAttribute('aria-invalid')).toBe(false);
    });

    test('keeps its value while read only', async () => {
        const [fixture, root] = await render(ReadonlyHostComponent);
        const radios: HTMLInputElement[] = findInputs(root);

        radios[1]?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.car()).toBe(GOLF);
        expect(radios.map(radio => radio.checked)).toEqual([true, false, false]);
        expect(radios[1]?.disabled).toBe(false);
    });

    test('takes its color from the config', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ color: 'success' })] });
        const [, root] = await render(CarsHostComponent);

        expect(findInputs(root)[0]?.classList).toContain('checked:border-success');
        expect(root.querySelector('label')?.classList).toContain('data-[selected=true]:border-success-text');
    });
});

describe('InputCardsComponent segmented', () => {
    test('is a row of labels around hidden radio buttons, the chosen one marked with a check', async () => {
        const [fixture, root] = await render(SizesHostComponent);
        const segments: HTMLLabelElement[] = [...root.querySelectorAll<HTMLLabelElement>('fieldset label')];
        const radios: HTMLInputElement[] = findInputs(root);

        expect(root.querySelector('legend')?.textContent).toBe('Size *');
        expect(segments.map(segment => segment.textContent.trim())).toEqual(['S', 'M', 'L']);
        expect(radios.map(radio => radio.type)).toEqual(['radio', 'radio', 'radio']);
        expect(radios[0]?.classList).toContain('sr-only');
        expect(radios[2]?.disabled).toBe(true);
        expect(segments.map(segment => segment.dataset['selected'])).toEqual(['false', 'true', 'false']);
        expect(segments.map(segment => segment.querySelector('svg') != undefined)).toEqual([false, true, false]);

        segments[0]?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.size()).toBe('s');
        expect(segments.map(segment => segment.querySelector('svg') != undefined)).toEqual([true, false, false]);
    });
});

describe('InputCardsMultipleComponent', () => {
    test('is a group of checkboxes whose values it adds in the order they are chosen, and removes again', async () => {
        const [fixture, root] = await render(ExtrasHostComponent);
        const checkboxes: HTMLInputElement[] = findInputs(root);
        expect(checkboxes.map(checkbox => checkbox.type)).toEqual(['checkbox', 'checkbox', 'checkbox']);

        checkboxes[2]?.click();
        checkboxes[0]?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual(['second-driver', 'child-seat']);

        checkboxes[2]?.closest('label')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.chosen()).toEqual(['child-seat']);
        expect(checkboxes.map(checkbox => checkbox.checked)).toEqual([true, false, false]);
    });

    test('needs at least one value by default', async () => {
        const [fixture, root] = await render(ExtrasHostComponent);
        const checkboxes: HTMLInputElement[] = findInputs(root);
        expect(checkboxes[0]?.checkValidity()).toBe(false);

        await dispatchInvalid(fixture, checkboxes[0]);
        expect(findText(root, root.querySelector('fieldset')?.getAttribute('aria-describedby'))).toBe('This field is required.');

        checkboxes[1]?.click();
        await fixture.whenStable();
        expect(checkboxes[0]?.checkValidity()).toBe(true);
    });
});
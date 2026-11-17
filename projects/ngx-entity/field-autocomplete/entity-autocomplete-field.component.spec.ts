import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntityClass, Property } from '@service-soft/ngx-entity/entity';
import { EntityFormComponent } from '@service-soft/ngx-entity/form';
import { FormTestingUtilities } from 'testing/form';
import { describe, expect, test } from 'vitest';

class Trip {
    @Property.string({ displayName: 'City', displayStyle: 'autocomplete', options: ['Berlin', 'Bremen'], minLength: 3 })
    city!: string;

    @Property.string({ displayName: 'Airport', displayStyle: 'autocomplete', options: ['BER', 'HAM'], restrictToOptions: true })
    airport!: string;
}

@Component({
    selector: 'ngx-host',
    template: '<ngx-entity-form [entity]="entity" [(value)]="value" />',
    imports: [EntityFormComponent]
})
class HostComponent {
    readonly entity: EntityClass<Trip> = Trip;
    readonly value: WritableSignal<Partial<Trip>> = signal({});
}

async function render(): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    // the fields load their components first.
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getInput(root: HTMLElement, label: string): HTMLInputElement {
    const input: HTMLInputElement | undefined = FormTestingUtilities.findLabelledInput(root, label);
    if (input == undefined) {
        throw new Error(`No input labelled "${label}".`);
    }
    return input;
}

async function type(fixture: ComponentFixture<HostComponent>, input: HTMLInputElement, text: string): Promise<void> {
    input.value = text;
    input.dispatchEvent(new InputEvent('input', { inputType: 'insertText' }));
    await fixture.whenStable();
}

describe('EntityAutocompleteFieldComponent', () => {
    test('takes any text that meets the rules of the string, and suggests the options', async () => {
        const [fixture, root] = await render();
        const city: HTMLInputElement = getInput(root, 'City');

        await type(fixture, city, 'Paris');
        expect(fixture.componentInstance.value()).toEqual({ city: 'Paris' });
        expect(city.checkValidity()).toBe(true);

        await type(fixture, city, 'Br');
        expect([...root.querySelectorAll('[role="option"]')].map(option => option.textContent.trim())).toEqual(['Bremen']);
        expect(city.checkValidity()).toBe(false);
    });

    test('only takes an option when the property restricts it to them', async () => {
        const [fixture, root] = await render();
        const airport: HTMLInputElement = getInput(root, 'Airport');

        await type(fixture, airport, 'MUC');
        expect(fixture.componentInstance.value().airport).toBeUndefined();
        expect(airport.checkValidity()).toBe(false);
    });
});
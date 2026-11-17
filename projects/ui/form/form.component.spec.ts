import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from '@service-soft/ui/button';
import { InputStringComponent } from '@service-soft/ui/input-string';
import { describe, expect, test } from 'vitest';

import { FormComponent } from './form.component';

// a control inside the template of another component, which belongs to the native form all the same.
@Component({
    selector: 'ui-address-fields',
    template: '<ui-input-string label="City" [(value)]="city" />',
    imports: [InputStringComponent]
})
class AddressFieldsComponent {
    readonly city: WritableSignal<string> = signal('');
}

@Component({
    selector: 'ui-form-host',
    template: `
        <ui-form (submit)="submits = submits + 1">
            <ui-input-string label="Name" [(value)]="name" /><ui-address-fields /><button ui-button type="submit">Save</button>
        </ui-form>
    `,
    imports: [FormComponent, InputStringComponent, AddressFieldsComponent, ButtonComponent]
})
class FormHostComponent {
    readonly name: WritableSignal<string> = signal('');
    submits: number = 0;
}

async function render(): Promise<[ComponentFixture<FormHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<FormHostComponent> = TestBed.createComponent(FormHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

async function submit(fixture: ComponentFixture<FormHostComponent>, root: HTMLElement): Promise<void> {
    root.querySelector('button')?.click();
    await fixture.whenStable();
}

describe('FormComponent', () => {
    test('doesn\'t submit invalid values, but shows every error and focuses the first invalid control', async () => {
        const [fixture, root] = await render();
        await submit(fixture, root);

        expect(fixture.componentInstance.submits).toBe(0);
        expect([...root.querySelectorAll('input')].map(input => input.getAttribute('aria-invalid'))).toEqual(['true', 'true']);
        expect(document.activeElement).toBe(root.querySelector('input'));
    });

    test('submits once when every control is valid, including the ones inside other components', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.name.set('Jane');
        await fixture.whenStable();
        await submit(fixture, root);
        expect(fixture.componentInstance.submits).toBe(0);
        expect(document.activeElement).toBe(root.querySelector('ui-address-fields input'));

        const city: HTMLInputElement | null = root.querySelector('ui-address-fields input');
        if (city) {
            city.value = 'Berlin';
        }
        city?.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        await submit(fixture, root);
        expect(fixture.componentInstance.submits).toBe(1);
    });
});
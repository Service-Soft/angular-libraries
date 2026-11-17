import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntityClass, EntityUtilities, Property } from '@service-soft/ngx-entity/entity';
import { FormComponent } from '@service-soft/ui/form';
import { describe, expect, test } from 'vitest';
import { ValidationProblem } from 'zibri-contract';

import { EntityFormMode } from './entity-form-mode.type';
import { EntityFormComponent } from './entity-form.component';

class Contact {
    @Property.string({ displayName: 'Name' })
    name!: string;

    @Property.string({ displayName: 'Email', format: 'email' })
    email!: string;
}

class Customer {
    @Property.string({ displayName: 'Name' })
    name!: string;

    @Property.string({ displayName: 'Street', position: { tab: 2, tabName: 'Address' } })
    street!: string;
}

class Account {
    @Property.string({ displayName: 'Email', format: 'email' })
    email!: string;

    @Property.string({ displayName: 'Password', password: true })
    password!: string;
}

class Address {
    @Property.string({ displayName: 'Street' })
    street!: string;

    @Property.string({ displayName: 'City', default: 'Berlin' })
    city!: string;

    // gets the address, not the customer
    @Property.string({ displayName: 'State', required: false, display: address => address.city !== 'Berlin' })
    state?: string;
}

const HEAD_OFFICE: Address = { street: 'Main street 1', city: 'Berlin' };

class Company {
    @Property.object({ displayName: 'Address', cls: () => Address })
    address!: Address;

    @Property.object({
        displayName: 'Billing address',
        cls: () => Address,
        displayStyle: 'dropdown',
        options: [{ label: 'Head office', value: HEAD_OFFICE }]
    })
    billing!: Address;
}

class Delivery {
    @Property.object({ displayName: 'Address', cls: () => Address, required: false })
    address?: Address;
}

@Component({
    selector: 'ngx-host',
    template: `
        <ui-form (submit)="submits.set(submits() + 1)">
            <ngx-entity-form [entity]="entity()" [mode]="mode()" [problems]="problems()" [(value)]="value" /><button type="submit">Save</button>
        </ui-form>
    `,
    imports: [FormComponent, EntityFormComponent]
})
class HostComponent {
    readonly entity: WritableSignal<EntityClass<object>> = signal(Contact);
    readonly mode: WritableSignal<EntityFormMode> = signal('create');
    readonly value: WritableSignal<Partial<object>> = signal(EntityUtilities.resolveDefaults(Contact));
    readonly problems: WritableSignal<ValidationProblem[]> = signal([]);
    readonly submits: WritableSignal<number> = signal(0);
}

async function render(
    entity: EntityClass<object> = Contact,
    mode: EntityFormMode = 'create'
): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.componentInstance.entity.set(entity);
    fixture.componentInstance.mode.set(mode);
    // the fields load their components first.
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findInput(root: HTMLElement, label: string): HTMLInputElement {
    const element: HTMLLabelElement | undefined = [...root.querySelectorAll('label')].find(candidate => candidate.textContent?.trim().startsWith(label));
    const input: HTMLElement | null = document.getElementById(element?.htmlFor ?? '');
    if (!(input instanceof HTMLInputElement)) {
        throw new TypeError(`No input labelled "${label}".`);
    }
    return input;
}

async function type(fixture: ComponentFixture<HostComponent>, input: HTMLInputElement, text: string): Promise<void> {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
}

describe('EntityFormComponent', () => {
    test('shows a field for every property, without tabs while all are on one, and changes the values', async () => {
        const [fixture, root] = await render();

        expect(root.querySelector('[role="tablist"]')).toBeNull();
        await type(fixture, findInput(root, 'Name'), 'Ada');
        await type(fixture, findInput(root, 'Email'), 'ada@example.com');
        expect(fixture.componentInstance.value()).toEqual({ name: 'Ada', email: 'ada@example.com' });
    });

    test('shows the properties of every tab in tabs, named by the property that names them, the first one General', async () => {
        const [, root] = await render(Customer);

        expect([...root.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.trim())).toEqual(['General', 'Address']);
    });

    test('shows the problems of the server at their fields until the user changes them', async () => {
        const [fixture, root] = await render();
        await type(fixture, findInput(root, 'Email'), 'ada@example.com');

        fixture.componentInstance.problems.set([{ key: 'email', code: 'unique', message: 'This email is taken.' }]);
        await fixture.whenStable();
        const email: HTMLInputElement = findInput(root, 'Email');
        expect(document.getElementById(email.getAttribute('aria-describedby') ?? '')?.textContent?.trim()).toBe('This email is taken.');

        await type(fixture, email, 'ada@example.org');
        expect(email.validity.valid).toBe(true);
        expect(email.hasAttribute('aria-invalid')).toBe(false);
    });

    test('opens the tab of the first invalid field when the form is submitted', async () => {
        const [fixture, root] = await render(Customer);
        await type(fixture, findInput(root, 'Name'), 'ACME');

        root.querySelector('form')?.requestSubmit();
        await fixture.whenStable();
        expect(fixture.componentInstance.submits()).toBe(0);
        expect(root.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim()).toBe('Address');
    });

    test('has a password typed twice, with its strength, and sends it once', async () => {
        const [fixture, root] = await render(Account);
        const password: HTMLInputElement = findInput(root, 'Password');
        const repeated: HTMLInputElement = findInput(root, 'Repeat Password');
        expect(password.type).toBe('password');
        expect(password.autocomplete).toBe('new-password');
        await type(fixture, findInput(root, 'Email'), 'ada@example.com');
        await type(fixture, password, 'Secret-123');
        expect(root.textContent).toContain('Password strength: medium');

        await type(fixture, repeated, 'Secret-12');
        root.querySelector('form')?.requestSubmit();
        await fixture.whenStable();
        expect(fixture.componentInstance.submits()).toBe(0);
        expect(document.getElementById(repeated.getAttribute('aria-describedby') ?? '')?.textContent?.trim()).toBe('The passwords differ.');

        await type(fixture, repeated, 'Secret-123');
        root.querySelector('form')?.requestSubmit();
        await fixture.whenStable();
        expect(fixture.componentInstance.submits()).toBe(1);
        expect(fixture.componentInstance.value()).toEqual({ email: 'ada@example.com', password: 'Secret-123' });
    });

    test('shows the fields of an inline object in a group, with the defaults of its class and its problems by path', async () => {
        const [fixture, root] = await render(Company);
        fixture.componentInstance.value.set(EntityUtilities.resolveDefaults(Company));
        await fixture.whenStable();
        expect(root.querySelector('fieldset legend')?.textContent?.trim()).toBe('Address');
        expect(findInput(root, 'City').value).toBe('Berlin');
        // its condition gets the address
        expect([...root.querySelectorAll('label')].some(label => label.textContent?.includes('State'))).toBe(false);

        await type(fixture, findInput(root, 'Street'), 'Elm street 2');
        await type(fixture, findInput(root, 'City'), 'Munich');
        expect(fixture.componentInstance.value()).toEqual({ address: { street: 'Elm street 2', city: 'Munich' } });
        expect(findInput(root, 'State')).toBeDefined();

        fixture.componentInstance.problems.set([{ key: 'address.city', code: 'invalid', message: 'We don\'t deliver there.' }]);
        await fixture.whenStable();
        const city: HTMLInputElement = findInput(root, 'City');
        expect(document.getElementById(city.getAttribute('aria-describedby') ?? '')?.textContent?.trim()).toBe('We don\'t deliver there.');
    });

    test('requires the fields of an optional object only once one has a value, and leaves it out while empty', async () => {
        const [fixture, root] = await render(Delivery);
        expect(fixture.componentInstance.value()).toEqual({});
        expect(findInput(root, 'Street').required).toBe(false);

        await type(fixture, findInput(root, 'Street'), 'Elm street 2');
        expect(findInput(root, 'City').required).toBe(true);
        expect(fixture.componentInstance.value()).toEqual({ address: { street: 'Elm street 2' } });

        await type(fixture, findInput(root, 'Street'), '');
        expect(fixture.componentInstance.value()).toEqual({});
        expect(findInput(root, 'City').required).toBe(false);
    });

    test('chooses an object of a dropdown, and shows a copy of one as chosen', async () => {
        const [fixture, root] = await render(Company);
        fixture.componentInstance.value.set({ billing: { ...HEAD_OFFICE } });
        await fixture.whenStable();
        const select: HTMLSelectElement | null = root.querySelector('select');
        expect(select?.selectedOptions[0]?.textContent?.trim()).toBe('Head office');

        fixture.componentInstance.value.set({});
        await fixture.whenStable();
        if (select == undefined) {
            throw new Error('The select did not render.');
        }
        select.value = '0';
        select.dispatchEvent(new Event('change'));
        await fixture.whenStable();
        expect(fixture.componentInstance.value()).toEqual({ billing: HEAD_OFFICE });
    });

    test('keeps the password of an existing entity while its field stays empty', async () => {
        const [fixture, root] = await render(Account, 'update');
        fixture.componentInstance.value.set({ email: 'ada@example.com' });
        await fixture.whenStable();
        const password: HTMLInputElement = findInput(root, 'Password');
        expect(password.required).toBe(false);
        expect(findInput(root, 'Repeat Password').required).toBe(false);

        // a new one has to be repeated
        await type(fixture, password, 'Secret-123');
        expect(findInput(root, 'Repeat Password').required).toBe(true);
    });
});
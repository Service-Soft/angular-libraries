import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateRange, EntityClass, EntityUtilities, Property } from '@service-soft/ngx-entity/entity';
import { EntityFormComponent } from '@service-soft/ngx-entity/form';
import { FormComponent } from '@service-soft/ui/form';
import { FormTestingUtilities } from 'testing/form';
import { describe, expect, test } from 'vitest';

class Booking {
    @Property.dateRange({ displayName: 'Stay', required: false })
    stay?: DateRange;
}

@Component({
    selector: 'ngx-host',
    template: `
        <ui-form (submit)="submits.set(submits() + 1)">
            <ngx-entity-form [entity]="entity" [(value)]="value" /><button type="submit">Save</button>
        </ui-form>
    `,
    imports: [FormComponent, EntityFormComponent]
})
class HostComponent {
    readonly entity: EntityClass<Booking> = Booking;
    readonly value: WritableSignal<Partial<Booking>> = signal(EntityUtilities.resolveDefaults(Booking));
    readonly submits: WritableSignal<number> = signal(0);
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

async function enter(fixture: ComponentFixture<HostComponent>, input: HTMLInputElement, date: string): Promise<void> {
    input.value = date;
    input.dispatchEvent(new Event('change'));
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
}

describe('EntityDateRangeFieldComponent', () => {
    test('takes a start and an end, the end not before the start', async () => {
        const [fixture, root] = await render();
        await enter(fixture, getInput(root, 'Start'), '08/10/2026');
        const end: HTMLInputElement = getInput(root, 'End');
        await enter(fixture, end, '08/01/2026');
        end.dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(document.getElementById(end.getAttribute('aria-describedby') ?? '')?.textContent?.trim()).toBe('The value is too small.');

        await enter(fixture, end, '08/21/2026');
        expect(fixture.componentInstance.value()).toEqual({ stay: { start: new Date(2026, 7, 10), end: new Date(2026, 7, 21) } });
    });

    test('needs both dates or neither, even when it isn\'t required', async () => {
        const [fixture, root] = await render();
        root.querySelector('form')?.requestSubmit();
        await fixture.whenStable();
        expect(fixture.componentInstance.submits()).toBe(1);

        await enter(fixture, getInput(root, 'Start'), '08/10/2026');
        root.querySelector('form')?.requestSubmit();
        await fixture.whenStable();
        expect(fixture.componentInstance.submits()).toBe(1);
        const end: HTMLInputElement = getInput(root, 'End');
        expect(document.getElementById(end.getAttribute('aria-describedby') ?? '')?.textContent?.trim()).toBe('This field is required.');

        await enter(fixture, getInput(root, 'Start'), '');
        expect(fixture.componentInstance.value()).toEqual({ stay: undefined });
    });
});
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateRange, EntityClass, EntityUtilities, Property } from '@service-soft/ngx-entity/entity';
import { EntityFormComponent } from '@service-soft/ngx-entity/form';
import { FormComponent } from '@service-soft/ui/form';
import { FormTestingUtilities } from 'testing/form';
import { describe, expect, test } from 'vitest';

class Course {
    @Property.array({ displayName: 'Sessions', required: true, items: { type: 'date' } })
    sessions!: Date[];

    @Property.array({ displayName: 'Holidays', items: { type: 'dateRange' } })
    holidays!: DateRange[];
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
    readonly entity: EntityClass<Course> = Course;
    readonly value: WritableSignal<Partial<Course>> = signal(EntityUtilities.resolveDefaults(Course));
    readonly submits: WritableSignal<number> = signal(0);
}

async function render(): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    // the fields load their components first.
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getInputs(root: HTMLElement, legend: string): HTMLInputElement[] {
    const fieldset: HTMLFieldSetElement | undefined = [...root.querySelectorAll('fieldset')]
        .find(candidate => candidate.querySelector('legend')?.textContent?.replace('*', '').trim() === legend);
    return [...fieldset?.querySelectorAll('ui-input-date input') ?? []].filter(input => input instanceof HTMLInputElement);
}

function findButton(root: ParentNode, name: string): HTMLButtonElement | undefined {
    return [...root.querySelectorAll('button')].find(button => (button.getAttribute('aria-label') ?? button.textContent.trim()) === name);
}

async function enter(fixture: ComponentFixture<HostComponent>, input: HTMLInputElement | undefined, date: string): Promise<void> {
    if (input == undefined) {
        throw new Error('The input did not render.');
    }
    input.value = date;
    input.dispatchEvent(new Event('change'));
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
}

describe('EntityDateArrayFieldComponent', () => {
    test('adds dates with the input below the table, and removes them with the button of their row', async () => {
        const [fixture, root] = await render();
        const [date] = getInputs(root, 'Sessions');
        await enter(fixture, date, '03/02/2026');

        findButton(root.querySelectorAll('fieldset')[0] ?? root, 'Add')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.value().sessions).toEqual([new Date(2026, 2, 2)]);
        expect(date?.value).toBe('');

        findButton(root, 'Remove Mar 2, 2026')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.value().sessions).toEqual([]);
    });

    test('adds a range only once its end doesn\'t come before its start', async () => {
        const [fixture, root] = await render();
        const holidays: HTMLFieldSetElement | undefined = root.querySelectorAll('fieldset')[1];
        const [start, end] = getInputs(root, 'Holidays');
        await enter(fixture, start, '08/10/2026');
        await enter(fixture, end, '08/01/2026');
        expect(findButton(holidays ?? root, 'Add')?.disabled).toBe(true);

        await enter(fixture, end, '08/21/2026');
        findButton(holidays ?? root, 'Add')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.value().holidays).toEqual([{ start: new Date(2026, 7, 10), end: new Date(2026, 7, 21) }]);
        expect(holidays?.querySelector('tbody')?.textContent).toContain('Aug 21, 2026');
    });

    test('doesn\'t submit while a required array has no item, with the error at the input that adds one', async () => {
        const [fixture, root] = await render();
        const [date] = getInputs(root, 'Sessions');

        root.querySelector('form')?.requestSubmit();
        await fixture.whenStable();
        expect(fixture.componentInstance.submits()).toBe(0);
        expect(document.getElementById(date?.getAttribute('aria-describedby') ?? '')?.textContent?.trim()).toBe('This field is required.');
        expect(FormTestingUtilities.findLabelledInput(root, 'Date')).toBe(date);
    });
});
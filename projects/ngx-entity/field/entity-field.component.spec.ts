import { Component, computed, Signal, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntityProperty, EntityUtilities, Property, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { describe, expect, test } from 'vitest';

import { EntityFieldComponent } from './entity-field.component';
import { provideEntityFields } from './entity-fields.provider';

enum TaskStatus {
    OPEN = 'open',
    DONE = 'done'
}

class Task {
    @Property.string({ displayName: 'Title', description: 'What to do', minLength: 3 })
    title!: string;

    @Property.string({ displayName: 'Email', format: 'email', required: false })
    email?: string;

    @Property.string({ displayName: 'Notes', displayStyle: 'textarea', required: false })
    notes?: string;

    @Property.string({ displayName: 'Status', enum: TaskStatus })
    status!: TaskStatus;

    @Property.number({ displayName: 'Estimate', format: 'integer', min: 0 })
    estimate!: number;

    @Property.number({ displayName: 'Progress', displayStyle: 'slider', min: 0, max: 1 })
    progress!: number;

    @Property.boolean({ displayName: 'Reviewed', mustBeChecked: task => task.status === TaskStatus.DONE })
    reviewed!: boolean;

    @Property.date({ displayName: 'Due', displayStyle: 'datetime', after: new Date(2026, 0, 1) })
    due!: Date;

    // a field of its own, which reads what it needs from data.
    @Property.custom({ displayName: 'Color', data: ['red', 'green'], component: async () => await Promise.resolve(ColorFieldComponent) })
    color?: string;
}

@Component({
    selector: 'ngx-color-field',
    template: `
        @for (color of colors(); track color) {
            <button type="button" [attr.aria-pressed]="value() === color" (click)="value.set(color)">{{ color }}</button>
        }
    `
})
class ColorFieldComponent extends BaseEntityFieldDirective<Task, string> {
    readonly colors: Signal<string[]> = computed(() => {
        const metadata: PropertyMetadata<Task> = this.property().metadata;
        return metadata.type === 'custom' && Array.isArray(metadata.data) ? metadata.data.filter(color => typeof color === 'string') : [];
    });
}

@Component({
    selector: 'ngx-host',
    // a field per property, like a form has them.
    templateUrl: './entity-field.component.spec.html',
    imports: [EntityFieldComponent]
})
class HostComponent {
    readonly properties: EntityProperty<Task>[] = EntityUtilities.resolveProperties(Task);
    readonly values: WritableSignal<Partial<Task>> = signal(EntityUtilities.resolveDefaults(Task));
    readonly problems: WritableSignal<Record<string, string | undefined>> = signal({});

    isRequired(property: EntityProperty<Task>): boolean {
        return EntityUtilities.resolveCondition(property.metadata.required, this.values());
    }

    getValue(key: string): unknown {
        return Reflect.get(this.values(), key);
    }

    setValue(key: string, value: unknown): void {
        const values: Partial<Task> = { ...this.values() };
        Reflect.set(values, key, value);
        this.values.set(values);
    }
}

// a field of the app's own, in place of the date field.
@Component({
    selector: 'ngx-own-date-field',
    template: '<p>Own field of {{ property().key }}</p>'
})
class OwnDateFieldComponent extends BaseEntityFieldDirective<Task, Date> {}

async function render(): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    // the fields load their components first.
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findControl<E extends HTMLElement>(root: HTMLElement, label: string, type: new () => E): E {
    const element: HTMLLabelElement | undefined = [...root.querySelectorAll('label')].find(candidate => candidate.textContent?.trim().startsWith(label));
    const control: HTMLElement | null = document.getElementById(element?.htmlFor ?? '');
    if (!(control instanceof type)) {
        throw new Error(`No ${type.name} labelled "${label}".`);
    }
    return control;
}

function findDescription(control: HTMLElement): string | undefined {
    return document.getElementById(control.getAttribute('aria-describedby') ?? '')?.textContent?.trim() ?? undefined;
}

describe('EntityFieldComponent', () => {
    test('shows each property in the field of its kind, with the rules of its decorator', async () => {
        const [, root] = await render();

        const title: HTMLInputElement = findControl(root, 'Title', HTMLInputElement);
        expect([title.type, title.minLength, title.required]).toEqual(['text', 3, true]);
        expect(findDescription(title)).toBe('What to do');
        expect(findControl(root, 'Email', HTMLInputElement).type).toBe('email');
        expect(findControl(root, 'Notes', HTMLTextAreaElement).required).toBe(false);
        expect([...findControl(root, 'Status', HTMLSelectElement).options].map(option => option.text.trim())).toContain('done');
        const estimate: HTMLInputElement = findControl(root, 'Estimate', HTMLInputElement);
        expect([estimate.type, estimate.step, estimate.min]).toEqual(['number', '1', '0']);
        const progress: HTMLInputElement = findControl(root, 'Progress', HTMLInputElement);
        expect([progress.type, progress.step, progress.value]).toEqual(['range', '0.01', '0']);
        // a date with its time, its example in the placeholder shows that
        expect(findControl(root, 'Due', HTMLInputElement).placeholder).toMatch(/^12\/31\/\d{4}, 06:30\sPM$/);
    });

    test('allows a date only from the one its decorator says on', async () => {
        const [fixture, root] = await render();
        const due: HTMLInputElement = findControl(root, 'Due', HTMLInputElement);

        due.value = '12/31/2025, 11:00 PM';
        due.dispatchEvent(new Event('input'));
        due.dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(findDescription(due)).toBe('The value is too small.');
    });

    test('changes the value of the entity, an empty text to nothing', async () => {
        const [fixture, root] = await render();
        const title: HTMLInputElement = findControl(root, 'Title', HTMLInputElement);

        title.value = 'Write';
        title.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.componentInstance.values().title).toBe('Write');

        title.value = '';
        title.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.componentInstance.values().title).toBeUndefined();
    });

    test('makes a boolean that must be checked required, by a condition on the entity', async () => {
        const [fixture, root] = await render();
        expect(findControl(root, 'Reviewed', HTMLInputElement).required).toBe(false);

        fixture.componentInstance.setValue('status', TaskStatus.DONE);
        await fixture.whenStable();
        expect(findControl(root, 'Reviewed', HTMLInputElement).required).toBe(true);
    });

    test('shows the problem the server found right away, as the error of the field', async () => {
        const [fixture, root] = await render();
        const title: HTMLInputElement = findControl(root, 'Title', HTMLInputElement);
        fixture.componentInstance.setValue('title', 'Write');
        await fixture.whenStable();

        fixture.componentInstance.problems.set({ title: 'A task with this title exists already.' });
        await fixture.whenStable();
        expect(title.getAttribute('aria-invalid')).toBe('true');
        expect(findDescription(title)).toBe('A task with this title exists already.');
        expect(title.validity.valid).toBe(false);
    });

    test('shows a custom property with its own component, which binds the value and reads its data', async () => {
        const [fixture, root] = await render();
        const buttons: HTMLButtonElement[] = [...root.querySelectorAll<HTMLButtonElement>('ngx-color-field button')];
        expect(buttons.map(button => button.textContent.trim())).toEqual(['red', 'green']);

        buttons[1]?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.values().color).toBe('green');
        expect(buttons[1]?.getAttribute('aria-pressed')).toBe('true');
    });

    test('shows a kind with the component the app gives for it', async () => {
        TestBed.configureTestingModule({ providers: [provideEntityFields({ date: () => Promise.resolve(OwnDateFieldComponent) })] });
        const [, root] = await render();

        expect(root.textContent).toContain('Own field of due');
        expect(root.querySelector('ui-input-date')).toBeNull();
    });
});
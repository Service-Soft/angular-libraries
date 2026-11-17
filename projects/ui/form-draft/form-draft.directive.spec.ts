import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { InputOption } from '@service-soft/ui/input';
import { InputBooleanComponent } from '@service-soft/ui/input-boolean';
import { InputSelectComponent } from '@service-soft/ui/input-select';
import { InputStringComponent } from '@service-soft/ui/input-string';
import { InputTextareaComponent } from '@service-soft/ui/input-textarea';
import { afterEach, describe, expect, test } from 'vitest';

import { FormDraftDirective } from './form-draft.directive';

const KEY: string = 'ui-form-draft:contact';

@Component({
    selector: 'ui-form-draft-host',
    templateUrl: './form-draft.directive.spec.html',
    imports: [
        ButtonComponent,
        FormComponent,
        FormDraftDirective,
        InputBooleanComponent,
        InputSelectComponent,
        InputStringComponent,
        InputTextareaComponent
    ]
})
class FormDraftHostComponent {
    readonly topics: InputOption<string>[] = [{ label: 'Appointment', value: 'appointment' }, { label: 'Invoice', value: 'invoice' }];

    readonly name: WritableSignal<string> = signal('');
    readonly message: WritableSignal<string> = signal('');
    readonly topic: WritableSignal<string | undefined> = signal(undefined);
    readonly callBack: WritableSignal<boolean> = signal(false);
    readonly password: WritableSignal<string> = signal('');

    submits: number = 0;
}

async function render(): Promise<[ComponentFixture<FormDraftHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<FormDraftHostComponent> = TestBed.createComponent(FormDraftHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the native field, not the control around it, which has the name as an attribute as well.
function findField<T extends Element>(root: HTMLElement, name: string): T {
    const field: T | null = root.querySelector<T>(`:is(input, textarea, select)[name="${name}"]`);
    if (field == undefined) {
        throw new Error(`The field ${name} did not render.`);
    }
    return field;
}

async function type(fixture: ComponentFixture<FormDraftHostComponent>, field: HTMLInputElement | HTMLTextAreaElement, text: string): Promise<void> {
    field.value = text;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
}

describe('FormDraftDirective', () => {
    afterEach(() => {
        sessionStorage.clear();
    });

    test('keeps what the user types, but never a password or a field that is left out', async () => {
        const [fixture, root] = await render();
        await type(fixture, findField(root, 'name'), 'Ada');
        await type(fixture, findField(root, 'password'), 'secret');
        await type(fixture, findField(root, 'secret'), 'secret');
        findField<HTMLInputElement>(root, 'callBack').click();
        await fixture.whenStable();

        expect(JSON.parse(sessionStorage.getItem(KEY) ?? '{}')).toEqual({ name: 'Ada', message: '', topic: '', callBack: true });
    });

    test('fills the controls in again when the user comes back', async () => {
        sessionStorage.setItem(KEY, JSON.stringify({ name: 'Ada', message: 'Hello', topic: '1', callBack: true, password: 'secret' }));
        const [fixture] = await render();
        const host: FormDraftHostComponent = fixture.componentInstance;

        expect([host.name(), host.message(), host.topic(), host.callBack(), host.password()]).toEqual(['Ada', 'Hello', 'invoice', true, '']);
    });

    test('forgets the draft once the form is submitted', async () => {
        const [fixture, root] = await render();
        await type(fixture, findField(root, 'name'), 'Ada');
        await type(fixture, findField(root, 'message'), 'Hello');
        fixture.componentInstance.topic.set('appointment');
        await fixture.whenStable();
        expect(sessionStorage.getItem(KEY)).not.toBeNull();

        root.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.submits).toBe(1);
        expect(sessionStorage.getItem(KEY)).toBeNull();
    });

    test('ignores what something else stored under its key', async () => {
        sessionStorage.setItem(KEY, 'not a draft');
        const [fixture] = await render();

        expect(fixture.componentInstance.name()).toBe('');
    });
});
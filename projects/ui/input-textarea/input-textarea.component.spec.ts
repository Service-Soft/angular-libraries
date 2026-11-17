import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputValidation, provideInputConfig } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { InputTextareaComponent } from './input-textarea.component';

@Component({
    selector: 'ui-two-way-host',
    template: '<ui-input-textarea class="max-w-80" label="Message" hint="Shown to the driver" [(value)]="message" />',
    imports: [InputTextareaComponent]
})
class TwoWayHostComponent {
    readonly message: WritableSignal<string> = signal('Ring twice.');
}

@Component({
    selector: 'ui-attributes-host',
    template: `
        <ui-input-textarea label="Message" inputId="message" name="message" placeholder="Your message" autocomplete="off" [rows]="6" />
        <ui-input-textarea label="Note" [required]="false" disabled />
    `,
    imports: [InputTextareaComponent]
})
class AttributesHostComponent {}

@Component({
    selector: 'ui-length-host',
    template: `
        <ui-input-textarea label="Review" [minLength]="10" [maxLength]="20" [customValidation]="validateNoLinks" [showValidationError]="true" [(value)]="review" />
    `,
    imports: [InputTextareaComponent]
})
class LengthHostComponent {
    readonly review: WritableSignal<string> = signal('Great.');
    readonly validateNoLinks: InputValidation<string> = value => value.includes('http') ? 'No links.' : undefined;
}

@Component({
    selector: 'ui-required-host',
    template: '<ui-input-textarea label="Message" />',
    imports: [InputTextareaComponent]
})
class RequiredHostComponent {}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getTextarea(root: HTMLElement, index: number = 0): HTMLTextAreaElement {
    const textarea: HTMLTextAreaElement | undefined = root.querySelectorAll('textarea')[index];
    if (textarea == undefined) {
        throw new Error('The textarea did not render.');
    }
    return textarea;
}

function findDescription(root: HTMLElement, textarea: HTMLTextAreaElement): string | undefined {
    const ids: string[] = textarea.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

describe('InputTextareaComponent', () => {
    test('binds the value two-way, line breaks included', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const textarea: HTMLTextAreaElement = getTextarea(root);
        expect(textarea.value).toBe('Ring twice.');

        textarea.value = 'Ring twice.\nThen knock.';
        textarea.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.componentInstance.message()).toBe('Ring twice.\nThen knock.');

        fixture.componentInstance.message.set('Leave it at the door.');
        await fixture.whenStable();
        expect(textarea.value).toBe('Leave it at the door.');
    });

    test('is labelled, described by its hint, required and resizable in height', async () => {
        const [, root] = await render(TwoWayHostComponent);
        const textarea: HTMLTextAreaElement = getTextarea(root);

        expect(root.querySelector('label')?.getAttribute('for')).toBe(textarea.id);
        expect(textarea.id).toMatch(/^ui-input-\d+$/);
        expect(textarea.required).toBe(true);
        expect(textarea.rows).toBe(3);
        expect(findDescription(root, textarea)).toBe('Shown to the driver');
        expect([...textarea.classList]).toEqual(expect.arrayContaining(['resize-y', 'border-outline']));
    });

    test('passes its inputs on to the native textarea', async () => {
        const [, root] = await render(AttributesHostComponent);
        const message: HTMLTextAreaElement = getTextarea(root);
        const note: HTMLTextAreaElement = getTextarea(root, 1);

        expect(message.id).toBe('message');
        expect(message.name).toBe('message');
        expect(message.placeholder).toBe('Your message');
        expect(message.autocomplete).toBe('off');
        expect(message.rows).toBe(6);
        expect(note.required).toBe(false);
        expect(note.disabled).toBe(true);
    });

    test('checks the lengths also for a text set from code, before customValidation', async () => {
        const [fixture, root] = await render(LengthHostComponent);
        const textarea: HTMLTextAreaElement = getTextarea(root);
        expect(textarea.checkValidity()).toBe(false);
        expect(findDescription(root, textarea)).toBe('The value is too short.');

        fixture.componentInstance.review.set('Far too long for this field.');
        await fixture.whenStable();
        expect(findDescription(root, textarea)).toBe('The value is too long.');

        fixture.componentInstance.review.set('See http://x');
        await fixture.whenStable();
        expect(findDescription(root, textarea)).toBe('No links.');

        fixture.componentInstance.review.set('Really great.');
        await fixture.whenStable();
        expect(textarea.checkValidity()).toBe(true);
        expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    });

    test('shows its error instead of the popup of the browser, once a form is submitted', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ errorMessages: { valueMissing: 'Pflichtfeld.' } })] });
        const [fixture, root] = await render(RequiredHostComponent);
        const textarea: HTMLTextAreaElement = getTextarea(root);
        expect(textarea.hasAttribute('aria-invalid')).toBe(false);

        const invalid: Event = new Event('invalid', { cancelable: true });
        textarea.dispatchEvent(invalid);
        await fixture.whenStable();
        expect(invalid.defaultPrevented).toBe(true);
        expect(textarea.getAttribute('aria-invalid')).toBe('true');
        expect(findDescription(root, textarea)).toBe('Pflichtfeld.');
    });

    test('takes its rows from the config', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ textareaRows: 8 })] });
        const [, root] = await render(RequiredHostComponent);

        expect(getTextarea(root).rows).toBe(8);
    });
});
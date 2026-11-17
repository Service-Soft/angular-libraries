import { Component, computed, Signal, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideInputConfig } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { InputBooleanComponent } from './input-boolean.component';

@Component({
    selector: 'ui-two-way-host',
    template: '<ui-input-boolean label="Newsletter" hint="Once a month" name="newsletter" [(value)]="newsletter" />',
    imports: [InputBooleanComponent]
})
class TwoWayHostComponent {
    readonly newsletter: WritableSignal<boolean> = signal(false);
}

@Component({
    selector: 'ui-terms-host',
    template: '<ui-input-boolean label="I accept the terms" required [(value)]="accepted" />',
    imports: [InputBooleanComponent]
})
class TermsHostComponent {
    readonly accepted: WritableSignal<boolean> = signal(false);
}

@Component({
    selector: 'ui-consent-host',
    template: `
        <ui-input-boolean required [(value)]="accepted">
            I accept the <a href="#privacy" (click)="$event.preventDefault()">privacy policy</a>.
        </ui-input-boolean>
    `,
    imports: [InputBooleanComponent]
})
class ConsentHostComponent {
    readonly accepted: WritableSignal<boolean> = signal(false);
}

@Component({
    selector: 'ui-switch-host',
    template: `
        <ui-input-boolean label="Notifications" appearance="switch" [(value)]="notifications" />
        <ui-input-boolean label="Dark mode" readonly [(value)]="darkMode" />
    `,
    imports: [InputBooleanComponent]
})
class SwitchHostComponent {
    readonly notifications: WritableSignal<boolean> = signal(true);
    readonly darkMode: WritableSignal<boolean> = signal(true);
}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getCheckbox(root: HTMLElement, index: number = 0): HTMLInputElement {
    const checkbox: HTMLInputElement | undefined = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[index];
    if (checkbox == undefined) {
        throw new Error('The checkbox did not render.');
    }
    return checkbox;
}

function findDescription(root: HTMLElement, checkbox: HTMLInputElement): string | undefined {
    const ids: string[] = checkbox.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

describe('InputBooleanComponent', () => {
    test('binds the value two-way, also when its label is clicked', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const checkbox: HTMLInputElement = getCheckbox(root);
        expect(checkbox.checked).toBe(false);

        checkbox.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.newsletter()).toBe(true);

        root.querySelector('label')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.newsletter()).toBe(false);

        fixture.componentInstance.newsletter.set(true);
        await fixture.whenStable();
        expect(checkbox.checked).toBe(true);
    });

    test('is a checkbox labelled after it and described by its hint, optional by default', async () => {
        const [, root] = await render(TwoWayHostComponent);
        const checkbox: HTMLInputElement = getCheckbox(root);

        expect(root.querySelector('label')?.getAttribute('for')).toBe(checkbox.id);
        expect(checkbox.compareDocumentPosition(root.querySelector('label') as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(checkbox.name).toBe('newsletter');
        expect(checkbox.required).toBe(false);
        expect(checkbox.hasAttribute('role')).toBe(false);
        expect(findDescription(root, checkbox)).toBe('Once a month');
    });

    test('has to be checked when required, and shows it instead of the popup of the browser', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ errorMessages: { valueMissing: 'Bitte bestätigen.' } })] });
        const [fixture, root] = await render(TermsHostComponent);
        const checkbox: HTMLInputElement = getCheckbox(root);
        expect(checkbox.checkValidity()).toBe(false);

        const invalid: Event = new Event('invalid', { cancelable: true });
        checkbox.dispatchEvent(invalid);
        await fixture.whenStable();
        expect(invalid.defaultPrevented).toBe(true);
        expect(checkbox.getAttribute('aria-invalid')).toBe('true');
        expect(findDescription(root, checkbox)).toBe('Bitte bestätigen.');

        checkbox.click();
        await fixture.whenStable();
        expect(checkbox.checkValidity()).toBe(true);
        expect(checkbox.hasAttribute('aria-invalid')).toBe(false);
    });

    test('takes its content as the label, links included, which the user follows without checking it', async () => {
        const [fixture, root] = await render(ConsentHostComponent);
        const checkbox: HTMLInputElement = getCheckbox(root);
        const label: HTMLLabelElement | null = root.querySelector('label');

        expect(label?.getAttribute('for')).toBe(checkbox.id);
        // the star of a required one is hidden from screen readers, which announce required themselves
        expect(label?.querySelector('span:not([aria-hidden])')?.textContent.replaceAll(/\s+/g, ' ').trim()).toBe('I accept the privacy policy.');
        expect(label?.querySelector('a')?.getAttribute('href')).toBe('#privacy');

        label?.querySelector('a')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.accepted()).toBe(false);

        label?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.accepted()).toBe(true);
    });

    test('is a switch with a thumb when it says so, and keeps its value while read only', async () => {
        const [fixture, root] = await render(SwitchHostComponent);
        const notifications: HTMLInputElement = getCheckbox(root);
        const darkMode: HTMLInputElement = getCheckbox(root, 1);
        expect(notifications.getAttribute('role')).toBe('switch');
        expect(notifications.nextElementSibling?.getAttribute('aria-hidden')).toBe('true');

        darkMode.click();
        await fixture.whenStable();
        expect(darkMode.checked).toBe(true);
        expect(fixture.componentInstance.darkMode()).toBe(true);
        expect(darkMode.disabled).toBe(false);
        expect(darkMode.getAttribute('aria-readonly')).toBe('true');
    });

    test('takes its appearance from the config', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ booleanAppearance: 'switch' })] });
        const [, root] = await render(TwoWayHostComponent);

        expect(getCheckbox(root).getAttribute('role')).toBe('switch');
    });

    test('shows a checkbox as partly checked while it is indeterminate, a switch never', async () => {
        const [fixture, root] = await render(GroupHostComponent);
        const all: HTMLInputElement = getCheckbox(root);
        expect(all.indeterminate).toBe(true);
        expect(getCheckbox(root, 1).indeterminate).toBe(false);

        // checks the whole group, which then isn't partly checked anymore
        all.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.checked()).toEqual(['email', 'sms']);
        expect(all.indeterminate).toBe(false);
        expect(all.checked).toBe(true);
    });
});

@Component({
    selector: 'ui-group-host',
    template: `
        <ui-input-boolean label="All" [value]="allChecked()" [indeterminate]="someChecked()" (valueChange)="checkAll($event)" />
        <ui-input-boolean label="Switch" appearance="switch" indeterminate />
    `,
    imports: [InputBooleanComponent]
})
class GroupHostComponent {
    readonly checked: WritableSignal<string[]> = signal(['email']);
    readonly allChecked: Signal<boolean> = computed(() => this.checked().length === 2);
    readonly someChecked: Signal<boolean> = computed(() => this.checked().length === 1);

    checkAll(checked: boolean): void {
        this.checked.set(checked ? ['email', 'sms'] : []);
    }
}
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideInputConfig } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { InputStringValidation } from './input-string-validation.type';
import { InputStringComponent } from './input-string.component';

@Component({
    selector: 'ui-two-way-host',
    template: '<ui-input-string class="max-w-80" label="Name" hint="As in your passport" [(value)]="name" />',
    imports: [InputStringComponent]
})
class TwoWayHostComponent {
    readonly name: WritableSignal<string> = signal('Jane');
}

@Component({
    selector: 'ui-attributes-host',
    template: `
        <ui-input-string label="Email" inputId="email" name="email" type="email" placeholder="jane@example.com" autocomplete="email" />
        <ui-input-string label="Nickname" [required]="false" disabled />
        <ui-input-string label="Code" inputMode="numeric" autocomplete="one-time-code" />
    `,
    imports: [InputStringComponent]
})
class AttributesHostComponent {}

@Component({
    selector: 'ui-password-host',
    template: `
        <ui-input-string label="Password" type="password" autocomplete="current-password" [(value)]="password" />
        <ui-input-string label="Old password" type="password" disabled />
    `,
    imports: [InputStringComponent]
})
class PasswordHostComponent {
    readonly password: WritableSignal<string> = signal('secret');
}

@Component({
    selector: 'ui-validation-host',
    template: '<ui-input-string label="Postcode" pattern="\\d{5}" [(value)]="postcode" [(showValidationError)]="showError" />',
    imports: [InputStringComponent]
})
class ValidationHostComponent {
    readonly postcode: WritableSignal<string> = signal('');
    readonly showError: WritableSignal<boolean> = signal(false);
}

@Component({
    selector: 'ui-custom-validation-host',
    template: `
        <ui-input-string label="Password" type="password" [(value)]="password" />
        <ui-input-string label="Repeat password" type="password" [customValidation]="validateRepeated" [(value)]="repeated" />
    `,
    imports: [InputStringComponent]
})
class CustomValidationHostComponent {
    readonly password: WritableSignal<string> = signal('secret');
    readonly repeated: WritableSignal<string> = signal('');
    readonly validateRepeated: InputStringValidation = value => value === this.password() ? undefined : 'The passwords differ.';
}

@Component({
    selector: 'ui-length-host',
    template: `
        <ui-input-string label="Code" [minLength]="4" [maxLength]="6" [customValidation]="validateCode" [showValidationError]="true" [(value)]="code" />
    `,
    imports: [InputStringComponent]
})
class LengthHostComponent {
    readonly code: WritableSignal<string> = signal('abc');
    readonly validateCode: InputStringValidation = value => value === value.toUpperCase() ? undefined : 'Only capital letters.';
}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getInput(root: HTMLElement, index: number = 0): HTMLInputElement {
    const input: HTMLInputElement | undefined = root.querySelectorAll('input')[index];
    if (input == undefined) {
        throw new Error('The input did not render.');
    }
    return input;
}

async function type(fixture: ComponentFixture<unknown>, input: HTMLInputElement, text: string): Promise<void> {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
}

function findDescription(root: HTMLElement, input: HTMLInputElement): string | undefined {
    const ids: string[] = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

describe('InputStringComponent', () => {
    test('binds the value two-way', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const input: HTMLInputElement = getInput(root);
        expect(input.value).toBe('Jane');

        await type(fixture, input, 'Jane Doe');
        expect(fixture.componentInstance.name()).toBe('Jane Doe');

        fixture.componentInstance.name.set('John');
        await fixture.whenStable();
        expect(input.value).toBe('John');
    });

    test('is labelled, described by its hint and required unless it says otherwise', async () => {
        const [, root] = await render(TwoWayHostComponent);
        const input: HTMLInputElement = getInput(root);

        expect(root.querySelector('label')?.getAttribute('for')).toBe(input.id);
        expect(input.id).toMatch(/^ui-input-\d+$/);
        expect(root.querySelector('label')?.textContent).toContain('*');
        expect(input.required).toBe(true);
        expect(findDescription(root, input)).toBe('As in your passport');
    });

    test('passes its inputs on to the native input', async () => {
        const [, root] = await render(AttributesHostComponent);
        const email: HTMLInputElement = getInput(root);
        const nickname: HTMLInputElement = getInput(root, 1);

        expect(email.id).toBe('email');
        expect(email.name).toBe('email');
        expect(email.type).toBe('email');
        expect(email.placeholder).toBe('jane@example.com');
        expect(email.autocomplete).toBe('email');
        expect(nickname.required).toBe(false);
        expect(nickname.disabled).toBe(true);
        expect(root.querySelectorAll('label')[1]?.textContent).not.toContain('*');
        expect(getInput(root, 2).inputMode).toBe('numeric');
        // only a password has a button next to it
        expect(root.querySelector('button')).toBeNull();
    });

    test('shows a password as text while its button is pressed, and keeps the value', async () => {
        const [fixture, root] = await render(PasswordHostComponent);
        const input: HTMLInputElement = getInput(root);
        const button: HTMLButtonElement | null = root.querySelector('button');
        expect(input.type).toBe('password');
        expect(button?.getAttribute('aria-label')).toBe('Show password');
        expect(button?.getAttribute('aria-pressed')).toBe('false');
        expect(button?.getAttribute('aria-controls')).toBe(input.id);

        button?.click();
        await fixture.whenStable();
        expect(input.type).toBe('text');
        expect(input.value).toBe('secret');
        expect(button?.getAttribute('aria-pressed')).toBe('true');

        button?.click();
        await fixture.whenStable();
        expect(input.type).toBe('password');
        // a disabled password can't be shown either
        expect(root.querySelectorAll('button')[1]?.disabled).toBe(true);
    });

    test('names the button that shows a password as the config says', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ showPasswordLabel: 'Passwort anzeigen' })] });
        const [, root] = await render(PasswordHostComponent);

        expect(root.querySelector('button')?.getAttribute('aria-label')).toBe('Passwort anzeigen');
    });

    test('shows the native validation error once the user left the input', async () => {
        const [fixture, root] = await render(ValidationHostComponent);
        const input: HTMLInputElement = getInput(root);
        expect(input.hasAttribute('aria-invalid')).toBe(false);

        input.dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(fixture.componentInstance.showError()).toBe(true);
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(findDescription(root, input)).toBe('This field is required.');

        await type(fixture, input, '1234');
        expect(findDescription(root, input)).toBe('The value has the wrong format.');

        await type(fixture, input, '12345');
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(findDescription(root, input)).toBeUndefined();
    });

    test('shows and hides the error with showValidationError', async () => {
        const [fixture, root] = await render(ValidationHostComponent);
        const input: HTMLInputElement = getInput(root);

        fixture.componentInstance.showError.set(true);
        await fixture.whenStable();
        expect(findDescription(root, input)).toBe('This field is required.');

        fixture.componentInstance.showError.set(false);
        await fixture.whenStable();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    test('validates with customValidation after the native rules and makes the native input invalid', async () => {
        const [fixture, root] = await render(CustomValidationHostComponent);
        const repeated: HTMLInputElement = getInput(root, 1);

        repeated.dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(findDescription(root, repeated)).toBe('This field is required.');

        await type(fixture, repeated, 'secrets');
        expect(repeated.validity.customError).toBe(true);
        expect(repeated.checkValidity()).toBe(false);
        expect(findDescription(root, repeated)).toBe('The passwords differ.');

        await type(fixture, repeated, 'secret');
        expect(repeated.checkValidity()).toBe(true);
        expect(repeated.hasAttribute('aria-invalid')).toBe(false);
    });

    test('checks minLength and maxLength also for a text set from code, before customValidation', async () => {
        const [fixture, root] = await render(LengthHostComponent);
        const input: HTMLInputElement = getInput(root);
        expect(input.checkValidity()).toBe(false);
        expect(findDescription(root, input)).toBe('The value is too short.');

        fixture.componentInstance.code.set('abcdefg');
        await fixture.whenStable();
        expect(input.checkValidity()).toBe(false);
        expect(findDescription(root, input)).toBe('The value is too long.');

        fixture.componentInstance.code.set('abcd');
        await fixture.whenStable();
        expect(findDescription(root, input)).toBe('Only capital letters.');

        fixture.componentInstance.code.set('ABCD');
        await fixture.whenStable();
        expect(input.checkValidity()).toBe(true);
    });

    test('updates the custom error when a signal it reads changes, also while the error is hidden', async () => {
        const [fixture, root] = await render(CustomValidationHostComponent);
        const repeated: HTMLInputElement = getInput(root, 1);
        await type(fixture, repeated, 'secret');
        expect(repeated.checkValidity()).toBe(true);

        await type(fixture, getInput(root), 'changed');
        expect(repeated.checkValidity()).toBe(false);
        expect(repeated.hasAttribute('aria-invalid')).toBe(false);
    });

    test('shows its error instead of the popup of the browser', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ errorMessages: { valueMissing: 'Pflichtfeld.' } })] });
        const [fixture, root] = await render(ValidationHostComponent);
        const input: HTMLInputElement = getInput(root);

        // checkValidity fires the invalid event like a submit does
        const invalid: Event = new Event('invalid', { cancelable: true });
        input.dispatchEvent(invalid);
        await fixture.whenStable();
        expect(invalid.defaultPrevented).toBe(true);
        expect(findDescription(root, input)).toBe('Pflichtfeld.');
    });

    test('uses the config for its defaults and keeps the classes of the consumer on its element', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ size: 'sm', required: false })] });
        const [, root] = await render(TwoWayHostComponent);

        expect([...root.querySelector('ui-input-string')?.classList ?? []]).toContain('max-w-80');
        expect([...getInput(root).classList]).toEqual(expect.arrayContaining(['min-h-8', 'border-outline']));
        expect(root.querySelector('label')?.textContent).not.toContain('*');
    });
});
@Component({
    selector: 'ui-strength-host',
    template: `
        <ui-input-string label="New password" type="password" passwordStrength [(value)]="password" />
        <ui-input-string label="Password" type="password" value="secret" />
    `,
    imports: [InputStringComponent]
})
class StrengthHostComponent {
    readonly password: WritableSignal<string> = signal('');
}

describe('InputStringComponent with passwordStrength', () => {
    test('says how hard the password is to guess while the user types, in a live region', async () => {
        const [fixture, root] = await render(StrengthHostComponent);
        const input: HTMLInputElement = getInput(root);
        const live: HTMLElement | null = root.querySelector('p[aria-live="polite"]');
        expect(live?.textContent?.trim()).toBe('');

        await type(fixture, input, 'secret');
        expect(live?.textContent?.trim()).toBe('Password strength: weak');

        await type(fixture, input, 'Secret-123');
        expect(live?.textContent?.trim()).toBe('Password strength: medium');

        await type(fixture, input, 'Correct-horse-battery-1');
        expect(live?.textContent?.trim()).toBe('Password strength: strong');
        // a password without it shows no strength
        expect(root.querySelectorAll('ui-input-string')[1]?.textContent).not.toContain('Password strength');
    });

    test('takes its texts and whether it shows from the config', async () => {
        TestBed.configureTestingModule({
            providers: [
                provideInputConfig({
                    passwordStrength: true,
                    passwordStrengthLabels: { weak: 'Schwach', medium: 'Mittel', strong: 'Stark' }
                })
            ]
        });
        const [, root] = await render(StrengthHostComponent);

        expect(root.querySelectorAll('ui-input-string')[1]?.textContent).toContain('Schwach');
    });
});
@Component({
    selector: 'ui-search-host',
    template: `
        <ui-input-string label="Search" type="search" [required]="false" [(value)]="query" />
        <ui-input-string label="Archive" type="search" value="2025" readonly />
    `,
    imports: [InputStringComponent]
})
class SearchHostComponent {
    readonly query: WritableSignal<string> = signal('');
}

describe('InputStringComponent with type search', () => {
    test('has a decorative icon, and a button that empties it while it has a text, which keeps the focus in the input', async () => {
        const [fixture, root] = await render(SearchHostComponent);
        const search: HTMLElement | undefined = root.querySelectorAll<HTMLElement>('ui-input-string')[0];
        const input: HTMLInputElement = getInput(root);

        expect(search?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        expect(input.classList).toContain('ps-9');
        expect(search?.querySelector('button')).toBeNull();

        await type(fixture, input, 'swimming');
        const clear: HTMLButtonElement | null | undefined = search?.querySelector('button');
        expect(clear?.getAttribute('aria-label')).toBe('Clear search');
        expect(clear?.getAttribute('aria-controls')).toBe(input.id);

        clear?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.query()).toBe('');
        expect(search?.querySelector('button')).toBeNull();
        expect(document.activeElement).toBe(input);
        // a read only search can't be emptied
        expect(root.querySelectorAll('ui-input-string')[1]?.querySelector('button')).toBeNull();
    });

    test('names the button as the config says', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ clearSearchLabel: 'Suche leeren' })] });
        const [fixture, root] = await render(SearchHostComponent);
        await type(fixture, getInput(root), 'swimming');

        expect(root.querySelector('button')?.getAttribute('aria-label')).toBe('Suche leeren');
    });
});
import { Component, ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideButtonConfig } from './button-config.provider';
import { ButtonComponent } from './button.component';

@Component({
    selector: 'ui-default-button-host',
    template: '<button ui-button type="button" class="w-full">Save</button>',
    imports: [ButtonComponent]
})
class DefaultButtonHostComponent {}

@Component({
    selector: 'ui-configured-button-host',
    template: '<button ui-button type="button" variant="outlined" color="error" size="lg">Delete</button>',
    imports: [ButtonComponent]
})
class ConfiguredButtonHostComponent {}

@Component({
    selector: 'ui-nested-config-host',
    template: '<button ui-button type="button">Cancel</button>',
    imports: [ButtonComponent],
    providers: [provideButtonConfig({ variant: 'text' })]
})
class NestedConfigHostComponent {}

@Component({
    selector: 'ui-elevated-host',
    template: `
        <button ui-button type="button" [elevation]="2">Save</button>
        <button ui-button type="button" variant="text" [elevation]="1">Cancel</button>
    `,
    imports: [ButtonComponent]
})
class ElevatedHostComponent {}

const ICON: string = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 5h2v14h-2zM5 11h14v2H5z" /></svg>';

@Component({
    selector: 'ui-icon-host',
    template: `
        <button ui-button type="button">${ICON} Add</button>
        <button ui-button type="button" iconOnly aria-label="Add">${ICON}</button>
    `,
    imports: [ButtonComponent]
})
class IconHostComponent {}

@Component({
    selector: 'ui-unlabeled-icon-host',
    template: `<button ui-button type="button" iconOnly>${ICON}</button>`,
    imports: [ButtonComponent]
})
class UnlabeledIconHostComponent {}

@Component({
    selector: 'ui-disabled-host',
    template: `
        <button ui-button type="button" disabled>Save</button>
        <a ui-button href="/somewhere" disabled>Open</a>
    `,
    imports: [ButtonComponent]
})
class DisabledHostComponent {}

@Component({
    selector: 'ui-toggle-host',
    template: `
        <button ui-button type="button" variant="outlined" [pressed]="true">Errors</button>
        <button ui-button type="button" variant="outlined" [pressed]="false">Debug</button>
    `,
    imports: [ButtonComponent]
})
class ToggleHostComponent {}

async function render<T>(component: new () => T): Promise<HTMLElement> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

function getClasses(root: HTMLElement, selector: string): string[] {
    return [...root.querySelector(selector)?.classList ?? []];
}

describe('ButtonComponent', () => {
    test('uses the default config and keeps the classes of the consumer', async () => {
        const classes: string[] = getClasses(await render(DefaultButtonHostComponent), 'button');
        expect(classes).toEqual(expect.arrayContaining(['bg-primary', 'text-on-primary', 'min-h-10', 'rounded-button', 'w-full']));
    });

    test('inputs override the config', async () => {
        const classes: string[] = getClasses(await render(ConfiguredButtonHostComponent), 'button');
        expect(classes).toEqual(expect.arrayContaining(['border-error', 'text-error', 'min-h-12']));
        expect(classes).not.toContain('bg-primary');
    });

    test('provideButtonConfig changes the defaults of the app', async () => {
        TestBed.configureTestingModule({ providers: [provideButtonConfig({ color: 'secondary', size: 'sm' })] });
        const classes: string[] = getClasses(await render(DefaultButtonHostComponent), 'button');
        expect(classes).toEqual(expect.arrayContaining(['bg-secondary', 'min-h-8']));
    });

    test('a nested provideButtonConfig only changes what it sets', async () => {
        TestBed.configureTestingModule({ providers: [provideButtonConfig({ size: 'sm' })] });
        const classes: string[] = getClasses(await render(NestedConfigHostComponent), 'button');
        expect(classes).toEqual(expect.arrayContaining(['text-primary', 'hover:bg-primary-tint', 'min-h-8']));
        expect(classes).not.toContain('bg-primary');
    });

    test('elevated buttons cast the shadow of their level and rise one level on hover', async () => {
        const root: HTMLElement = await render(ElevatedHostComponent);
        const filled: string[] = getClasses(root, 'button:first-child');
        const text: string[] = getClasses(root, 'button:last-child');

        expect(filled).toEqual(expect.arrayContaining(['shadow-2', 'hover:shadow-3', 'bg-primary']));
        expect(filled).not.toContain('bg-surface');
        // without a fill, the shadow would show through the button
        expect(text).toEqual(expect.arrayContaining(['shadow-1', 'hover:shadow-2', 'bg-surface']));
        const flat: string[] = getClasses(await render(DefaultButtonHostComponent), 'button');
        expect(flat.filter(cssClass => /(^|:)shadow-\d$/.test(cssClass))).toEqual([]);
    });

    test('icon-only buttons are square, buttons with text keep their padding', async () => {
        const root: HTMLElement = await render(IconHostComponent);
        const withText: string[] = getClasses(root, 'button:first-child');
        const iconOnly: string[] = getClasses(root, 'button:last-child');

        expect(withText).toEqual(expect.arrayContaining(['min-h-10', 'px-4', '[&_svg]:size-[1.25em]']));
        expect(iconOnly).toEqual(expect.arrayContaining(['min-h-10', 'min-w-10']));
        expect(iconOnly).not.toContain('px-4');
    });

    test('reports an icon-only button without a name to the error handler', async () => {
        const errors: unknown[] = [];
        TestBed.configureTestingModule({ providers: [{ provide: ErrorHandler, useValue: { handleError: (error: unknown) => errors.push(error) } }] });
        await render(UnlabeledIconHostComponent);
        expect(errors).toEqual([new Error('An iconOnly ui-button needs an aria-label or aria-labelledby, it has no text that screen readers could read.')]);

        errors.length = 0;
        await render(IconHostComponent);
        expect(errors).toEqual([]);
    });

    test('toggle buttons say whether they are pressed and are filled while they are', async () => {
        const root: HTMLElement = await render(ToggleHostComponent);
        const pressed: Element | null = root.querySelector('button:first-child');
        const unpressed: Element | null = root.querySelector('button:last-child');

        expect(pressed?.getAttribute('aria-pressed')).toBe('true');
        expect([...pressed?.classList ?? []]).toEqual(expect.arrayContaining(['bg-primary', 'text-on-primary']));
        expect(unpressed?.getAttribute('aria-pressed')).toBe('false');
        expect([...unpressed?.classList ?? []]).toEqual(expect.arrayContaining(['border-primary', 'text-primary']));
        // a button that isn't a toggle button has no pressed state for screen readers to announce
        expect((await render(DefaultButtonHostComponent)).querySelector('button')?.hasAttribute('aria-pressed')).toBe(false);
    });

    test('disables buttons natively and links with aria-disabled', async () => {
        const root: HTMLElement = await render(DisabledHostComponent);
        const button: HTMLButtonElement | null = root.querySelector('button');
        const link: HTMLAnchorElement | null = root.querySelector('a');

        expect(button?.disabled).toBe(true);
        expect(link?.getAttribute('aria-disabled')).toBe('true');
        expect(link?.getAttribute('tabindex')).toBe('-1');
        expect(link?.hasAttribute('disabled')).toBe(false);

        const click: MouseEvent = new MouseEvent('click', { cancelable: true });
        link?.dispatchEvent(click);
        expect(click.defaultPrevented).toBe(true);
    });
});
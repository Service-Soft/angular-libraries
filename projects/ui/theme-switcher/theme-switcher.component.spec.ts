import { Component, PLATFORM_ID, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawerComponent } from '@service-soft/ui/drawer';
import { MenuComponent } from '@service-soft/ui/menu';
import { PopoverTestingUtilities } from 'testing/popover';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { ThemeModeUtilities } from './theme-mode.utilities';
import { provideThemeSwitcherConfig } from './theme-switcher-config.provider';
import { ThemeSwitcherComponent } from './theme-switcher.component';
import { ThemeService } from './theme.service';

@Component({
    selector: 'ui-theme-switcher-host',
    template: '<ui-theme-switcher />',
    imports: [ThemeSwitcherComponent]
})
class HostComponent {}

@Component({
    selector: 'ui-theme-switcher-in-menu-host',
    template: '<ui-menu><ui-theme-switcher /></ui-menu>',
    imports: [ThemeSwitcherComponent, MenuComponent]
})
class InMenuHostComponent {}

@Component({
    selector: 'ui-theme-switcher-in-drawer-host',
    // closed, its content is there all the same
    template: '<ui-drawer label="Navigation"><ui-theme-switcher /></ui-drawer>',
    imports: [ThemeSwitcherComponent, DrawerComponent]
})
class InDrawerHostComponent {}

// the name, aria-pressed and whether the check shows, of every mode in the menu.
type ItemState = [string, string | null, boolean];

async function render(component: Type<unknown>): Promise<ComponentFixture<unknown>> {
    const fixture: ComponentFixture<unknown> = TestBed.createComponent(component);
    await fixture.whenStable();
    return fixture;
}

function getElement(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
}

function findItems(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
    return [...getElement(fixture).querySelectorAll<HTMLButtonElement>('ui-menu-item button')];
}

function getItemStates(fixture: ComponentFixture<unknown>): ItemState[] {
    return findItems(fixture).map(item => [
        item.textContent.trim(),
        item.getAttribute('aria-pressed'),
        item.querySelector('span.ms-auto')?.classList.contains('invisible') === false
    ]);
}

function getButtonLabel(fixture: ComponentFixture<unknown>): string | null | undefined {
    return getElement(fixture)
        .querySelector('button[ui-button]')
        ?.getAttribute('aria-label');
}

async function choose(fixture: ComponentFixture<unknown>, name: string): Promise<void> {
    findItems(fixture)
        .find(item => item.textContent.trim() === name)
        ?.click();
    await fixture.whenStable();
}

function getModeClasses(): string[] {
    return ['light', 'dark'].filter(mode => document.documentElement.classList.contains(mode));
}

describe('ThemeSwitcherComponent', () => {
    let removePopovers: () => void;

    beforeEach(() => {
        removePopovers = PopoverTestingUtilities.addPopovers();
    });

    afterEach(() => {
        removePopovers();
        localStorage.clear();
        ThemeModeUtilities.apply(document.documentElement, 'system');
    });

    test('follows the operating system until the user chooses, with a button named by the current mode', async () => {
        const fixture: ComponentFixture<unknown> = await render(HostComponent);

        expect(getButtonLabel(fixture)).toBe('Theme: System');
        const button: HTMLButtonElement | null = getElement(fixture).querySelector('button[ui-button]');
        expect(button?.getAttribute('popovertarget')).toBe(getElement(fixture).querySelector('ui-menu')?.id);
        expect(getItemStates(fixture)).toEqual([
            ['System', 'true', true],
            ['Light', 'false', false],
            ['Dark', 'false', false]
        ]);
        expect(getModeClasses()).toEqual([]);
    });

    test('applies the chosen mode to the page and remembers it, and following the system forgets it again', async () => {
        const fixture: ComponentFixture<unknown> = await render(HostComponent);

        await choose(fixture, 'Dark');
        expect(getModeClasses()).toEqual(['dark']);
        expect(localStorage.getItem(ThemeModeUtilities.STORAGE_KEY)).toBe('dark');
        expect(getButtonLabel(fixture)).toBe('Theme: Dark');
        expect(getItemStates(fixture)).toEqual([
            ['System', 'false', false],
            ['Light', 'false', false],
            ['Dark', 'true', true]
        ]);

        await choose(fixture, 'Light');
        expect(getModeClasses()).toEqual(['light']);

        await choose(fixture, 'System');
        expect(getModeClasses()).toEqual([]);
        expect(localStorage.getItem(ThemeModeUtilities.STORAGE_KEY)).toBeNull();
    });

    test('starts with the mode the user chose before', async () => {
        localStorage.setItem(ThemeModeUtilities.STORAGE_KEY, 'light');
        const fixture: ComponentFixture<unknown> = await render(HostComponent);

        expect(getButtonLabel(fixture)).toBe('Theme: Light');
        expect(getModeClasses()).toEqual(['light']);
    });

    test('is only the modes, as items of a menu it is in', async () => {
        const fixture: ComponentFixture<unknown> = await render(InMenuHostComponent);

        expect(getElement(fixture).querySelector('button[ui-button]')).toBeNull();
        expect(getElement(fixture).querySelectorAll('ui-menu')).toHaveLength(1);
        expect(getItemStates(fixture).map(([name]) => name)).toEqual(['System', 'Light', 'Dark']);
    });

    test('is a row of a drawer it is in, which names the current mode beside its icon', async () => {
        const fixture: ComponentFixture<unknown> = await render(InDrawerHostComponent);
        const button: HTMLButtonElement | null = getElement(fixture).querySelector('button[ui-link]');

        expect(getElement(fixture).querySelector('button[ui-button][iconOnly]')).toBeNull();
        expect(button?.getAttribute('aria-label')).toBeNull();
        expect(button?.textContent.replaceAll(/\s+/g, ' ').trim()).toBe('Theme: System');
        // the label for screen readers only, the mode shows
        expect(button?.querySelector('.sr-only')?.textContent.trim()).toBe('Theme:');

        await choose(fixture, 'Dark');
        expect(button?.textContent.replaceAll(/\s+/g, ' ').trim()).toBe('Theme: Dark');
    });

    test('takes its texts from the config', async () => {
        TestBed.configureTestingModule({
            providers: [provideThemeSwitcherConfig({ label: 'Design', modeLabels: { system: 'System', light: 'Hell', dark: 'Dunkel' } })]
        });
        const fixture: ComponentFixture<unknown> = await render(HostComponent);

        expect(getButtonLabel(fixture)).toBe('Design: System');
        expect(getItemStates(fixture).map(([name]) => name)).toEqual(['System', 'Hell', 'Dunkel']);
    });

    test('leaves the page as it is on the server, which can not know the choice of a browser', () => {
        localStorage.setItem(ThemeModeUtilities.STORAGE_KEY, 'dark');
        TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
        const themeService: ThemeService = TestBed.inject(ThemeService);

        expect(themeService.mode()).toBe('system');
        themeService.setMode('light');
        expect(getModeClasses()).toEqual([]);
        expect(localStorage.getItem(ThemeModeUtilities.STORAGE_KEY)).toBe('dark');
    });
});

describe('ThemeModeUtilities.INIT_SCRIPT', () => {
    afterEach(() => {
        localStorage.clear();
        ThemeModeUtilities.apply(document.documentElement, 'system');
    });

    // run like the browser runs it from the head of index.html: as plain source, outside of any module
    function runInitScript(): void {
        // eslint-disable-next-line typescript/no-implied-eval -- the script is source for the head of index.html, not code of the library
        Reflect.apply(new Function(ThemeModeUtilities.INIT_SCRIPT), undefined, []);
    }

    test('applies the stored mode before the app starts, and nothing without one', () => {
        runInitScript();
        expect(getModeClasses()).toEqual([]);

        localStorage.setItem(ThemeModeUtilities.STORAGE_KEY, 'dark');
        runInitScript();
        expect(getModeClasses()).toEqual(['dark']);
    });
});
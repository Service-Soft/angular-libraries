import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogTestingUtilities } from 'testing/dialog';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { provideDrawerConfig } from './drawer-config.provider';
import { DrawerComponent } from './drawer.component';

@Component({
    selector: 'ui-drawer-host',
    template: '<ui-drawer label="Navigation" [(open)]="open"><a href="#orders">Orders</a></ui-drawer>',
    imports: [DrawerComponent]
})
class DrawerHostComponent {
    readonly open: WritableSignal<boolean> = signal(false);
}

async function render(): Promise<[ComponentFixture<DrawerHostComponent>, HTMLDialogElement]> {
    const fixture: ComponentFixture<DrawerHostComponent> = TestBed.createComponent(DrawerHostComponent);
    await fixture.whenStable();
    const dialog: HTMLDialogElement | null = (fixture.nativeElement as HTMLElement).querySelector('dialog');
    if (dialog == undefined) {
        throw new Error('The drawer did not render.');
    }
    return [fixture, dialog];
}

describe('DrawerComponent', () => {
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
    });

    afterEach(() => {
        removeModalDialogs();
    });

    test('opens and closes with open, and open follows when the browser closes it', async () => {
        const [fixture, dialog] = await render();
        expect(dialog.open).toBe(false);
        expect(dialog.getAttribute('aria-label')).toBe('Navigation');

        fixture.componentInstance.open.set(true);
        await fixture.whenStable();
        expect(dialog.open).toBe(true);

        // like on escape
        dialog.close();
        await fixture.whenStable();
        expect(fixture.componentInstance.open()).toBe(false);
    });

    test('closes on a click next to it, but not on one inside of it', async () => {
        const [fixture, dialog] = await render();
        fixture.componentInstance.open.set(true);
        await fixture.whenStable();

        dialog.querySelector('a')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await fixture.whenStable();
        expect(dialog.open).toBe(true);

        // a click on the backdrop targets the dialog itself
        dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await fixture.whenStable();
        expect(dialog.open).toBe(false);
        expect(fixture.componentInstance.open()).toBe(false);
    });

    test('slides in from the side of the config', async () => {
        TestBed.configureTestingModule({ providers: [provideDrawerConfig({ side: 'end' })] });
        const [, dialog] = await render();

        expect(dialog.classList).toContain('ms-auto');
        expect(dialog.classList).not.toContain('me-auto');
    });

    test('shows its label with a button that closes it, and a theme color as a colored surface, from the config', async () => {
        TestBed.configureTestingModule({ providers: [provideDrawerConfig({ header: true, color: 'primary', closeLabel: 'Schließen' })] });
        const [fixture, dialog] = await render();
        fixture.componentInstance.open.set(true);
        await fixture.whenStable();

        expect(dialog.classList).toContain('surface-primary');
        expect(dialog.querySelector('h2')?.textContent.trim()).toBe('Navigation');
        const close: HTMLButtonElement | null = dialog.querySelector('button[aria-label="Schließen"]');
        close?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.open()).toBe(false);
        expect(dialog.open).toBe(false);
    });
});
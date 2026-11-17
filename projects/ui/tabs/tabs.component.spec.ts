import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { TabComponent } from './tab.component';
import { TabsComponent } from './tabs.component';

@Component({
    selector: 'ui-host',
    template: `
        <ui-tabs [(selected)]="selected"><ui-tab value="general" label="General"><p>General settings</p></ui-tab>
            <ui-tab value="address" label="Address"><input aria-label="Street" /></ui-tab>
            <ui-tab value="billing" label="Billing" disabled><p>Billing settings</p></ui-tab></ui-tabs>
    `,
    imports: [TabsComponent, TabComponent]
})
class HostComponent {
    readonly selected: WritableSignal<string | undefined> = signal(undefined);
}

async function render(): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findTabs(root: HTMLElement): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
}

function findShownPanels(root: HTMLElement): string[] {
    return [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
        .filter(panel => !panel.hasAttribute('hidden'))
        .map(panel => panel.textContent?.trim() ?? '');
}

describe('TabsComponent', () => {
    test('lists its tabs, each controlling its panel, and shows the first while none is selected', async () => {
        const [, root] = await render();
        const tabs: HTMLElement[] = findTabs(root);

        expect(root.querySelector('[role="tablist"]')).not.toBeNull();
        expect(tabs.map(tab => tab.textContent?.trim())).toEqual(['General', 'Address', 'Billing']);
        expect(tabs.map(tab => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
        expect(tabs[2]?.getAttribute('aria-disabled')).toBe('true');
        const panel: HTMLElement | undefined = root.querySelector<HTMLElement>(`#${tabs[0]?.getAttribute('aria-controls') ?? ''}`) ?? undefined;
        expect(panel?.getAttribute('role')).toBe('tabpanel');
        expect(findShownPanels(root)).toEqual(['General settings']);
    });

    test('selects a clicked tab, says so through selected, and follows selected set from code', async () => {
        const [fixture, root] = await render();

        findTabs(root)[1]?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.selected()).toBe('address');
        expect(findTabs(root)[1]?.getAttribute('aria-selected')).toBe('true');
        expect(root.querySelector('[role="tabpanel"]:not([hidden]) input')).not.toBeNull();

        fixture.componentInstance.selected.set('general');
        await fixture.whenStable();
        expect(findShownPanels(root)).toEqual(['General settings']);
    });

    test('renders the content of a tab the user never opened, hidden, so a form validates its fields', async () => {
        const [, root] = await render();

        const street: HTMLInputElement | undefined = root.querySelector('input') ?? undefined;
        expect(street?.closest<HTMLElement>('[role="tabpanel"]')?.hidden).toBe(true);
    });

    test('keeps the content of a hidden tab, inert, so a form keeps what was typed into it', async () => {
        const [fixture, root] = await render();
        findTabs(root)[1]?.click();
        await fixture.whenStable();
        const street: HTMLInputElement | undefined = root.querySelector('input') ?? undefined;
        if (street != undefined) {
            street.value = 'Main Street';
        }

        findTabs(root)[0]?.click();
        await fixture.whenStable();
        const hidden: HTMLElement | undefined = street?.closest<HTMLElement>('[role="tabpanel"]') ?? undefined;
        expect(hidden?.hidden).toBe(true);
        expect(hidden?.hasAttribute('inert')).toBe(true);
        expect(root.querySelector('input')).toBe(street);
        expect(street?.value).toBe('Main Street');
    });
});
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { FilterButtonComponent } from './filter-button.component';
import { provideSearchToolbarConfig } from './search-toolbar-config.provider';
import { SearchToolbarComponent } from './search-toolbar.component';

@Component({
    selector: 'ui-search-toolbar-host',
    template: `
        <ui-search-toolbar [resultCount]="resultCount()" [(search)]="query">
            <button ui-filter-button type="button" variant="outlined" [count]="filters()" (click)="opened = opened + 1">Filters</button>
        </ui-search-toolbar>
    `,
    imports: [FilterButtonComponent, SearchToolbarComponent]
})
class SearchToolbarHostComponent {
    readonly query: WritableSignal<string> = signal('');

    readonly resultCount: WritableSignal<number | undefined> = signal(12);

    readonly filters: WritableSignal<number> = signal(2);

    opened: number = 0;
}

@Component({
    selector: 'ui-filter-button-host',
    template: `
        <button ui-filter-button type="button">Filters</button>
        <button ui-filter-button type="button" [count]="1">Filters</button>
        <button ui-filter-button type="button" variant="text" color="secondary" [count]="3">Filters</button>
    `,
    imports: [FilterButtonComponent]
})
class FilterButtonHostComponent {}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// what screen readers read as the name of a button: its text, without what is hidden from them and the comments
// Angular places its blocks at.
function resolveName(button: Element | undefined): string {
    return [...button?.childNodes ?? []]
        .filter(node => node instanceof Element ? node.getAttribute('aria-hidden') !== 'true' : node instanceof Text)
        .map(node => node.textContent?.trim())
        .filter(text => text)
        .join(' ');
}

describe('SearchToolbarComponent', () => {
    test('binds the search two-way, holds the controls and says how many results there are in a status', async () => {
        const [fixture, root] = await render(SearchToolbarHostComponent);
        const input: HTMLInputElement | null = root.querySelector('input[type="search"]');

        expect(root.querySelector(`label[for="${input?.id}"]`)?.textContent.trim()).toBe('Search');
        expect(input?.placeholder).toBe('Search');
        expect(input?.required).toBe(false);
        if (input != undefined) {
            input.value = 'party';
            input.dispatchEvent(new Event('input'));
        }
        await fixture.whenStable();
        expect(fixture.componentInstance.query()).toBe('party');

        root.querySelector<HTMLButtonElement>('button[ui-filter-button]')?.click();
        expect(fixture.componentInstance.opened).toBe(1);

        expect(root.querySelector('[role="status"]')?.textContent).toBe('12 results');
        fixture.componentInstance.resultCount.set(1);
        await fixture.whenStable();
        expect(root.querySelector('[role="status"]')?.textContent).toBe('1 result');
        fixture.componentInstance.resultCount.set(undefined);
        await fixture.whenStable();
        expect(root.querySelector('[role="status"]')).toBeNull();
    });

    test('takes its texts from the config', async () => {
        TestBed.configureTestingModule({
            providers: [provideSearchToolbarConfig({ searchLabel: 'Suchen', resultCountLabel: count => `${count} Treffer`, activeFiltersLabel: count => `${count} aktiv` })]
        });
        const [, root] = await render(SearchToolbarHostComponent);

        expect(root.querySelector('input')?.placeholder).toBe('Suchen');
        expect(root.querySelector('[role="status"]')?.textContent).toBe('12 Treffer');
        expect(resolveName(root.querySelector('button[ui-filter-button]') ?? undefined)).toBe('Filters (2 aktiv)');
    });
});

describe('FilterButtonComponent', () => {
    test('is a ui-button with a funnel, and the number of active filters as a badge that screen readers read with what it counts', async () => {
        const [, root] = await render(FilterButtonHostComponent);
        const [none, filled, text] = root.querySelectorAll('button');

        expect(none?.classList).toContain('bg-primary');
        expect(none?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        expect(resolveName(none)).toBe('Filters');
        expect(resolveName(filled)).toBe('Filters (1 active)');
        // the badge is the other way round from the button
        expect(filled?.querySelector('span[aria-hidden="true"]')?.classList).toContain('bg-on-primary');
        expect(text?.querySelector('span[aria-hidden="true"]')?.textContent).toBe('3');
        expect(text?.querySelector('span[aria-hidden="true"]')?.classList).toContain('bg-secondary');
        expect(text?.classList).toContain('text-secondary-text');
    });
});
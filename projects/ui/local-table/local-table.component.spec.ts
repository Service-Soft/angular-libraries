import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from '@service-soft/ui/empty-state';
import { TableActionsComponent } from '@service-soft/ui/table';
import { describe, expect, test } from 'vitest';

import { LocalTableColumn } from './local-table-column.model';
import { LocalTableComponent } from './local-table.component';

type Customer = {
    name: string,
    orders: number
};

const CUSTOMERS: Customer[] = [
    { name: 'Ada', orders: 3 },
    { name: 'Alan', orders: 12 },
    { name: 'Grace', orders: 7 },
    { name: 'Linus', orders: 1 },
    { name: 'Margaret', orders: 9 }
];

@Component({
    selector: 'ui-host',
    templateUrl: './local-table.component.spec.html',
    imports: [LocalTableComponent, TableActionsComponent]
})
class HostComponent {
    readonly columns: LocalTableColumn<Customer>[] = [
        { key: 'name', label: 'Name', value: customer => customer.name, filter: { type: 'text' } },
        { key: 'orders', label: 'Orders', value: customer => String(customer.orders), sortable: true }
    ];

    readonly rows: WritableSignal<Customer[]> = signal(CUSTOMERS);
    readonly page: WritableSignal<number> = signal(1);
}

async function render(): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findNames(root: HTMLElement): string[] {
    return [...root.querySelectorAll('tbody tr td:first-child span:last-child')].map(cell => cell.textContent?.trim() ?? '');
}

async function filterByName(fixture: ComponentFixture<HostComponent>, root: HTMLElement, text: string): Promise<void> {
    const input: HTMLInputElement | undefined = root.querySelector<HTMLInputElement>('input[type="search"]') ?? undefined;
    if (input != undefined) {
        input.value = text;
        input.dispatchEvent(new Event('input'));
    }
    await fixture.whenStable();
}

describe('LocalTableComponent', () => {
    test('passes its actions on to the row of the label of the table, and everything else below it', async () => {
        const [, root] = await render();

        const label: HTMLElement | null = root.querySelector(`[id="${root.querySelector('table')?.getAttribute('aria-labelledby')}"]`);
        const description: HTMLElement | undefined = [...root.querySelectorAll('p')].find(paragraph => paragraph.textContent === 'Everyone who ordered.');
        expect(root.querySelector('ui-table-actions')?.parentElement).toBe(label?.parentElement);
        expect(description).toBeDefined();
        expect(description != undefined && label?.parentElement?.contains(description)).toBe(false);
    });

    test('shows the first page of all rows, and the next one through the pagination', async () => {
        const [fixture, root] = await render();
        expect(findNames(root)).toEqual(['Ada', 'Alan']);

        root.querySelector<HTMLButtonElement>('nav button[aria-label="Page 3"]')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.page()).toBe(3);
        expect(findNames(root)).toEqual(['Margaret']);
    });

    test('orders all rows, not only the ones of the page, and goes back to the first page', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.page.set(2);
        await fixture.whenStable();

        root.querySelector<HTMLButtonElement>('thead button:not([popovertarget])')?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.page()).toBe(1);
        expect(findNames(root)).toEqual(['Linus', 'Ada']);
    });

    test('filters all rows, and pages only the ones that pass', async () => {
        const [fixture, root] = await render();

        await filterByName(fixture, root, 'race');
        expect(findNames(root)).toEqual(['Grace']);
        expect(root.querySelector('nav')).toBeNull();

        await filterByName(fixture, root, 'a');
        expect(findNames(root)).toEqual(['Ada', 'Alan']);
        expect(root.querySelector('nav button[aria-label="Page 2"]')).not.toBeNull();
        expect(root.querySelector('nav button[aria-label="Page 3"]')).toBeNull();
    });

    test('shows the last page once the current one has no rows left, like after deleting its only row', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.page.set(3);
        await fixture.whenStable();

        fixture.componentInstance.rows.set(CUSTOMERS.slice(0, 4));
        await fixture.whenStable();
        expect(findNames(root)).toEqual(['Grace', 'Linus']);
        expect(root.querySelector('nav button[aria-current="page"]')?.textContent?.trim()).toBe('2');
    });

    test('says that nothing matches the filters by the empty state of the table, or by the one it is given', async () => {
        const [fixture, root] = await render();
        await filterByName(fixture, root, 'Zoe');
        const states: Element[] = [...root.querySelectorAll('tbody ui-empty-state')];
        expect(states.map(state => state.textContent.trim())).toEqual(['Nothing found.']);

        // the one of the table follows it, which hides behind it
        const own: ComponentFixture<EmptyStateHostComponent> = TestBed.createComponent(EmptyStateHostComponent);
        await own.whenStable();
        const ownStates: Element[] = [...(own.nativeElement as HTMLElement).querySelectorAll('tbody ui-empty-state')];
        expect(ownStates.map(state => state.textContent.trim())).toEqual(['No customers yet', 'Nothing found.']);
        expect(ownStates[1]?.matches('ui-empty-state + *')).toBe(true);
    });
});

@Component({
    selector: 'ui-empty-state-host',
    template: '<ui-local-table label="Customers" [columns]="[]" [rows]="[]"><ui-empty-state title="No customers yet" /></ui-local-table>',
    imports: [LocalTableComponent, EmptyStateComponent]
})
class EmptyStateHostComponent {}
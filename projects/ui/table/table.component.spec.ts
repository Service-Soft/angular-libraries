import { Component, signal, Signal, TemplateRef, viewChild, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { faInbox, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { EmptyStateActionsComponent, EmptyStateComponent } from '@service-soft/ui/empty-state';
import { provideInputConfig } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { TableActionsComponent } from './table-actions.component';
import { TableCellContext } from './table-cell-context.model';
import { TableColumn } from './table-column.model';
import { TableFilters } from './table-filters.type';
import { TableOrder } from './table-order.model';
import { TableComponent } from './table.component';

type Customer = {
    id: number,
    name: string,
    orders: number,
    status: 'Active' | 'Paused'
};

const ADA: Customer = { id: 1, name: 'Ada', orders: 3, status: 'Active' };
const ALAN: Customer = { id: 2, name: 'Alan', orders: 12, status: 'Paused' };
const GRACE: Customer = { id: 3, name: 'Grace', orders: 7, status: 'Active' };

@Component({
    selector: 'ui-host',
    // the table takes more bindings than an inline template has room for.
    templateUrl: './table.component.spec.html',
    imports: [TableComponent, TableActionsComponent]
})
class HostComponent {
    private readonly status: Signal<TemplateRef<TableCellContext<Customer>>> = viewChild.required<TemplateRef<TableCellContext<Customer>>>('status');

    readonly columns: WritableSignal<TableColumn<Customer>[]> = signal([
        { key: 'name', label: 'Name', value: customer => customer.name, sortable: true, filter: { type: 'text' } },
        { key: 'orders', label: 'Orders', value: customer => String(customer.orders), align: 'end' },
        {
            key: 'status',
            label: 'Status',
            value: customer => customer.status,
            filter: { type: 'select', options: [{ label: 'Active', value: 'Active' }, { label: 'Paused', value: 'Paused' }] }
        }
    ]);

    readonly hideLabel: WritableSignal<boolean> = signal(false);
    readonly required: WritableSignal<boolean> = signal(false);
    readonly invalid: WritableSignal<boolean> = signal(false);
    readonly rows: WritableSignal<Customer[]> = signal([ADA, ALAN]);
    readonly totalAmount: WritableSignal<number> = signal(3);
    readonly selectable: WritableSignal<boolean> = signal(true);
    readonly opens: WritableSignal<boolean> = signal(true);
    readonly loading: WritableSignal<boolean> = signal(false);
    readonly page: WritableSignal<number> = signal(1);
    readonly pageSize: WritableSignal<number> = signal(2);
    readonly order: WritableSignal<TableOrder | undefined> = signal(undefined);
    readonly filters: WritableSignal<TableFilters> = signal({});
    readonly selected: WritableSignal<Customer[]> = signal([]);
    readonly opened: WritableSignal<Customer | undefined> = signal(undefined);

    readonly getId: (customer: Customer) => number = customer => customer.id;

    useStatusTemplate(): void {
        this.columns.update(columns => columns.map(column => column.key === 'status' ? { ...column, cell: this.status() } : column));
    }
}

@Component({
    selector: 'ui-empty-state-host',
    template: `
        <ui-table label="Customers" [columns]="[]" [rows]="[]" [totalAmount]="0">
            <ui-empty-state title="No customers yet"><ui-empty-state-actions><button type="button">Add the first</button></ui-empty-state-actions></ui-empty-state>
        </ui-table>
    `,
    imports: [TableComponent, EmptyStateComponent, EmptyStateActionsComponent]
})
class EmptyStateHostComponent {}

async function render(): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findBodyRows(root: HTMLElement): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>('tbody tr')];
}

function findCheckboxes(root: HTMLElement): HTMLInputElement[] {
    return [...root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
}

function findSortButton(root: HTMLElement): HTMLButtonElement | undefined {
    return root.querySelector<HTMLButtonElement>('thead button') ?? undefined;
}

// the filter of a column is in a popover in its header, whose content is no part of the header while it is closed. The
// comments are the anchors of angular's control flow.
function findHeaderTexts(root: HTMLElement): string[] {
    return [...root.querySelectorAll('tr:first-child > th')].map(header => [...header.childNodes]
        .filter(node => node.nodeName !== 'UI-POPOVER' && node.nodeType !== Node.COMMENT_NODE)
        .map(node => node.textContent ?? '')
        .join('')
        .trim());
}

function findFilterPopover(root: HTMLElement, label: string): HTMLElement | undefined {
    const trigger: HTMLButtonElement | null = root.querySelector<HTMLButtonElement>(`thead button[aria-label="Filter ${label}"]`);
    return root.querySelector<HTMLElement>(`[id="${trigger?.getAttribute('popovertarget')}"]`) ?? undefined;
}

function isFilterMarked(root: HTMLElement, label: string): boolean {
    return root.querySelector(`thead button[aria-label="Filter ${label}"] span`) != undefined;
}

// the badges of the filters in the footer, which remove them
function findFilterBadges(root: HTMLElement): HTMLButtonElement[] {
    return [...root.querySelectorAll<HTMLButtonElement>('ul[aria-label="Filters"] button')];
}

function findFilterBadgeTexts(root: HTMLElement): string[] {
    return findFilterBadges(root).map(badge => badge.textContent?.trim() ?? '');
}

async function click(fixture: ComponentFixture<HostComponent>, element: HTMLElement | undefined): Promise<void> {
    element?.click();
    await fixture.whenStable();
}

describe('TableComponent', () => {
    test('shows a table named by its label, with a header per column and a cell per value', async () => {
        const [, root] = await render();

        const labelId: string | null | undefined = root.querySelector('table')?.getAttribute('aria-labelledby');
        expect(root.querySelector(`[id="${labelId}"]`)?.textContent?.trim()).toBe('Customers');
        expect(root.querySelector('caption')).toBeNull();
        expect(findHeaderTexts(root)).toEqual(['', 'Name', 'Orders', 'Status', 'Actions']);
        expect(root.querySelector('th[ui-table-header-cell]')?.getAttribute('aria-sort')).toBe('none');
        expect(root.querySelectorAll('th[ui-table-header-cell]')[1]?.hasAttribute('aria-sort')).toBe(false);
        const cells: string[] = [...findBodyRows(root)[1]?.querySelectorAll('td') ?? []].map(cell => cell.textContent?.trim() ?? '');
        // every value comes with the label of its column, which only shows on a phone
        expect(cells).toEqual(['', 'NameAlan', 'Orders12', 'StatusPaused', 'Delete Alan']);
    });

    test('shows its actions next to its label, and everything else it holds below it, both outside of the table', async () => {
        const [, root] = await render();

        const table: HTMLTableElement | null = root.querySelector('table');
        const label: HTMLElement | null = root.querySelector(`[id="${table?.getAttribute('aria-labelledby')}"]`);
        const actions: HTMLElement | null = root.querySelector('ui-table-actions');
        const description: HTMLElement | undefined = [...root.querySelectorAll('p')].find(paragraph => paragraph.textContent === 'The customers of this month.');
        expect(actions?.textContent).toBe('Create');
        expect(actions?.parentElement).toBe(label?.parentElement);
        expect(description).toBeDefined();
        // below the row of the label, and before the table
        expect(label?.parentElement?.compareDocumentPosition(description ?? root) ?? 0).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(description != undefined && table?.contains(description)).toBe(false);
        expect(description?.compareDocumentPosition(table ?? root) ?? 0).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    test('names the table by a caption only screen readers read when its label is hidden', async () => {
        const [fixture, root] = await render();

        fixture.componentInstance.hideLabel.set(true);
        await fixture.whenStable();

        expect(root.querySelector('table')?.hasAttribute('aria-labelledby')).toBe(false);
        expect(root.querySelector('caption.sr-only')?.textContent?.trim()).toBe('Customers');
        expect([...root.querySelectorAll('p')].some(paragraph => paragraph.textContent === 'Customers')).toBe(false);
    });

    test('marks its label as required and frames itself in the error color while invalid', async () => {
        const [fixture, root] = await render();
        const table: HTMLElement | null = root.querySelector('ui-table');

        fixture.componentInstance.required.set(true);
        fixture.componentInstance.invalid.set(true);
        await fixture.whenStable();

        const labelId: string | null | undefined = root.querySelector('table')?.getAttribute('aria-labelledby');
        expect(root.querySelector(`[id="${labelId}"] [aria-hidden="true"]`)?.textContent).toBe('*');
        expect(table?.classList.contains('border-error')).toBe(true);
        expect(table?.classList.contains('border-outline-variant')).toBe(false);
    });

    test('shows a cell through the template of its column', async () => {
        const [fixture, root] = await render();

        fixture.componentInstance.useStatusTemplate();
        fixture.componentInstance.rows.set([GRACE]);
        await fixture.whenStable();
        expect(findBodyRows(root)[0]?.querySelector('strong')?.textContent).toBe('Active');
    });

    test('orders by a column ascending, then descending, then not, back on the first page', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.page.set(2);
        await fixture.whenStable();

        await click(fixture, findSortButton(root));
        expect(fixture.componentInstance.order()).toEqual({ key: 'name', direction: 'ASC' });
        expect(fixture.componentInstance.page()).toBe(1);
        expect(root.querySelector('th[ui-table-header-cell]')?.getAttribute('aria-sort')).toBe('ascending');

        await click(fixture, findSortButton(root));
        expect(fixture.componentInstance.order()).toEqual({ key: 'name', direction: 'DESC' });
        expect(root.querySelector('th[ui-table-header-cell]')?.getAttribute('aria-sort')).toBe('descending');

        await click(fixture, findSortButton(root));
        expect(fixture.componentInstance.order()).toBeUndefined();
    });

    test('filters by a text and by an option, and leaves out a filter that was emptied', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.page.set(2);
        await fixture.whenStable();
        const text: HTMLInputElement | undefined = findFilterPopover(root, 'Name')?.querySelector('input') ?? undefined;
        // the native select of ui-input-select, which takes what the browser chooses in it like what the user chooses in its list
        const select: HTMLSelectElement | undefined = findFilterPopover(root, 'Status')?.querySelector('select') ?? undefined;
        // only the columns with a filter have a button for it
        expect(root.querySelector('thead button[aria-label="Filter Orders"]')).toBeNull();
        expect(findFilterBadges(root)).toEqual([]);
        expect(isFilterMarked(root, 'Name')).toBe(false);

        if (text != undefined && select != undefined) {
            text.value = 'al';
            text.dispatchEvent(new Event('input'));
            select.value = '1';
            select.dispatchEvent(new Event('change'));
        }
        await fixture.whenStable();
        expect(fixture.componentInstance.filters()).toEqual({ name: 'al', status: 'Paused' });
        expect(fixture.componentInstance.page()).toBe(1);
        expect(isFilterMarked(root, 'Name')).toBe(true);
        expect(isFilterMarked(root, 'Status')).toBe(true);
        expect(findFilterBadgeTexts(root)).toEqual(['Name: al', 'Status: Paused']);

        if (text != undefined) {
            text.value = '';
            text.dispatchEvent(new Event('input'));
        }
        await fixture.whenStable();
        expect(fixture.componentInstance.filters()).toEqual({ status: 'Paused' });
        expect(isFilterMarked(root, 'Name')).toBe(false);
        expect(findFilterBadgeTexts(root)).toEqual(['Status: Paused']);
    });

    test('removes a filter by its badge, back on the first page, and keeps the focus on the badges or the filter', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.filters.set({ name: 'a', status: 'Paused' });
        fixture.componentInstance.page.set(2);
        await fixture.whenStable();
        // named by what a click does, with the text it shows
        expect(findFilterBadges(root)[0]?.getAttribute('aria-label')).toBe('Remove filter Name: a');

        await click(fixture, findFilterBadges(root)[0]);
        expect(fixture.componentInstance.filters()).toEqual({ status: 'Paused' });
        expect(fixture.componentInstance.page()).toBe(1);
        expect(isFilterMarked(root, 'Name')).toBe(false);
        expect(document.activeElement).toBe(findFilterBadges(root)[0]);

        // the last badge leaves the focus on the button that opens its filter again
        await click(fixture, findFilterBadges(root)[0]);
        expect(fixture.componentInstance.filters()).toEqual({});
        expect(findFilterBadges(root)).toEqual([]);
        expect(document.activeElement).toBe(root.querySelector('thead button[aria-label="Filter Status"]'));
    });

    test('keeps the select of a filter optional while inputs are required by default, so it can filter nothing again', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ required: true })] });
        const [fixture, root] = await render();
        const select: HTMLSelectElement | undefined = findFilterPopover(root, 'Status')?.querySelector('select') ?? undefined;
        fixture.componentInstance.filters.set({ status: 'Paused' });
        await fixture.whenStable();

        expect(select?.required).toBe(false);
        if (select != undefined) {
            select.value = '';
            select.dispatchEvent(new Event('change'));
        }
        await fixture.whenStable();
        expect(fixture.componentInstance.filters()).toEqual({});
    });

    test('closes the popover of a filter on Enter in its text and on choosing an option', async () => {
        const [fixture, root] = await render();
        const name: HTMLElement | undefined = findFilterPopover(root, 'Name');
        const status: HTMLElement | undefined = findFilterPopover(root, 'Status');
        const text: HTMLInputElement | null | undefined = name?.querySelector('input');
        const select: HTMLSelectElement | null | undefined = status?.querySelector('select');
        name?.showPopover();
        status?.showPopover();

        text?.dispatchEvent(new Event('input'));
        expect(name?.hasAttribute('data-popover-open')).toBe(true);
        const enter: KeyboardEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        text?.dispatchEvent(enter);
        expect(name?.hasAttribute('data-popover-open')).toBe(false);
        // or it would press the trigger the focus returns to, which opens the popover again
        expect(enter.defaultPrevented).toBe(true);

        if (select != undefined) {
            select.value = '0';
            select.dispatchEvent(new Event('change'));
        }
        await fixture.whenStable();
        expect(status?.hasAttribute('data-popover-open')).toBe(false);
        expect(fixture.componentInstance.filters()).toEqual({ status: 'Active' });
    });

    test('selects rows, all of a page, and keeps the rows of other pages selected', async () => {
        const [fixture, root] = await render();
        const otherPage: Customer = GRACE;
        fixture.componentInstance.selected.set([otherPage]);
        await fixture.whenStable();

        await click(fixture, findCheckboxes(root)[1]);
        expect(fixture.componentInstance.selected()).toEqual([otherPage, ADA]);
        expect(findCheckboxes(root)[0]?.indeterminate).toBe(true);
        expect(findCheckboxes(root)[1]?.getAttribute('aria-label')).toBe('Select');
        expect(findCheckboxes(root)[1]?.getAttribute('aria-describedby')).toBe(findBodyRows(root)[0]?.querySelector('button')?.id);

        await click(fixture, findCheckboxes(root)[0]);
        expect(fixture.componentInstance.selected()).toEqual([otherPage, ADA, ALAN]);
        expect(findCheckboxes(root)[0]?.checked).toBe(true);
        expect(findCheckboxes(root)[0]?.indeterminate).toBe(false);

        await click(fixture, findCheckboxes(root)[0]);
        expect(fixture.componentInstance.selected()).toEqual([otherPage]);
    });

    test('keeps a reloaded row selected by its key', async () => {
        const [fixture, root] = await render();

        await click(fixture, findCheckboxes(root)[1]);
        fixture.componentInstance.rows.set([{ ...ADA }, { ...ALAN }]);
        await fixture.whenStable();
        expect(findCheckboxes(root)[1]?.checked).toBe(true);
    });

    test('opens a row by its first value or a click on it, but not by its checkbox or its actions', async () => {
        const [fixture, root] = await render();
        const row: HTMLElement | undefined = findBodyRows(root)[1];

        await click(fixture, row?.querySelector('button') ?? undefined);
        expect(fixture.componentInstance.opened()).toBe(ALAN);

        fixture.componentInstance.opened.set(undefined);
        await click(fixture, row?.querySelector('input') ?? undefined);
        await click(fixture, row?.querySelector('td:last-child button') ?? undefined);
        expect(fixture.componentInstance.opened()).toBeUndefined();

        await click(fixture, row?.querySelectorAll('td')[2]);
        expect(fixture.componentInstance.opened()).toBe(ALAN);
    });

    test('shows the first value as text while rows don\'t open', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.opens.set(false);
        fixture.componentInstance.selectable.set(false);
        await fixture.whenStable();

        expect(findBodyRows(root)[0]?.querySelector('td button')?.textContent).toBe('Delete Ada');
        expect(findCheckboxes(root)).toEqual([]);
        await click(fixture, findBodyRows(root)[0]?.querySelectorAll('td')[1]);
        expect(fixture.componentInstance.opened()).toBeUndefined();
    });

    test('says so while it has no rows, across every column', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.rows.set([]);
        fixture.componentInstance.totalAmount.set(0);
        await fixture.whenStable();

        const cell: HTMLElement | undefined = root.querySelector<HTMLElement>('tbody td') ?? undefined;
        expect(cell?.textContent?.trim()).toBe('Nothing found.');
        expect(cell?.querySelector('ui-empty-state svg path')?.getAttribute('d')).toBe(faInbox.icon[4]);
        expect(cell?.getAttribute('colspan')).toBe('5');
        expect(findCheckboxes(root)[0]?.checked).toBe(false);
        expect(findCheckboxes(root)[0]?.disabled).toBe(true);

        // no rows that match the filters are no results
        fixture.componentInstance.filters.set({ name: 'Zoe' });
        await fixture.whenStable();
        expect(root.querySelector('tbody td ui-empty-state svg path')?.getAttribute('d')).toBe(faMagnifyingGlass.icon[4]);
    });

    test('shows the empty state it is given in place of its own', async () => {
        const fixture: ComponentFixture<EmptyStateHostComponent> = TestBed.createComponent(EmptyStateHostComponent);
        await fixture.whenStable();
        const cell: HTMLElement | null = (fixture.nativeElement as HTMLElement).querySelector('tbody td');

        // the one of the table follows it, hidden by it
        const [own, fallback] = cell?.querySelectorAll('ui-empty-state') ?? [];
        expect(own?.textContent).toContain('No customers yet');
        expect(fallback?.matches('ui-empty-state + *')).toBe(true);
        expect(fallback?.classList).toContain('[ui-empty-state+&]:hidden');
        expect(cell?.querySelector('button')?.textContent).toBe('Add the first');
    });

    test('shows the pagination below while there is more than one page', async () => {
        const [fixture, root] = await render();

        root.querySelector<HTMLButtonElement>('nav button[aria-label="Page 2"]')?.click();
        await fixture.whenStable();
        // named after the table, so the pagination of each table on a page can be told apart from the others
        expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Pages of Customers');
        expect(fixture.componentInstance.page()).toBe(2);
    });

    test('says which rows the page shows, and changes the page size on the page that keeps its first row', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.totalAmount.set(30);
        fixture.componentInstance.page.set(6);
        await fixture.whenStable();
        const range: HTMLElement | undefined = root.querySelector<HTMLElement>('[role="status"]') ?? undefined;
        // the native select of ui-input-select, which takes what the browser chooses in it like what the user chooses in its list
        const pageSizeSelect: HTMLSelectElement | undefined = root.querySelector<HTMLSelectElement>('select[id$="-page-size"]') ?? undefined;
        expect(range?.textContent?.trim()).toBe('Showing 11–12 of 30');
        // the widest range of 30 rows keeps its width, unseen and unread
        expect(range?.parentElement?.querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('Showing 30–30 of 30');
        // the current page size is one of the options, the empty option comes first
        expect([...pageSizeSelect?.options ?? []].map(option => option.textContent?.trim())).toEqual(['', '2', '10', '25', '50', '100']);
        expect(root.querySelector(`label[for="${pageSizeSelect?.id}"]:not(.sr-only)`)?.textContent).toBe('Rows per page');

        if (pageSizeSelect != undefined) {
            pageSizeSelect.value = '1';
            pageSizeSelect.dispatchEvent(new Event('change'));
        }
        await fixture.whenStable();
        expect(fixture.componentInstance.pageSize()).toBe(10);
        expect(fixture.componentInstance.page()).toBe(2);
        expect(range?.textContent?.trim()).toBe('Showing 11–20 of 30');
    });

    test('covers the rows of the last page with a spinner while it loads, which can\'t be used meanwhile', async () => {
        const [fixture, root] = await render();
        const table: HTMLTableElement | null = root.querySelector('table');
        expect(table?.hasAttribute('aria-busy')).toBe(false);
        expect(root.querySelector('[role="progressbar"]')).toBeNull();

        fixture.componentInstance.loading.set(true);
        await fixture.whenStable();
        expect(table?.getAttribute('aria-busy')).toBe('true');
        expect(root.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe('Loading');
        const [ada, alan, spinner] = findBodyRows(root);
        expect(ada?.hasAttribute('inert')).toBe(true);
        expect(alan?.hasAttribute('inert')).toBe(true);
        // the row of the spinner covers the others, and isn't inert itself, so screen readers read it
        expect(spinner?.classList.contains('absolute')).toBe(true);
        expect(spinner?.hasAttribute('inert')).toBe(false);

        fixture.componentInstance.loading.set(false);
        await fixture.whenStable();
        expect(findBodyRows(root).some(row => row.hasAttribute('inert'))).toBe(false);
        expect(root.querySelector('[role="progressbar"]')).toBeNull();
    });

    test('shows the spinner in place of the text that says there are no rows, while the first page loads', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.rows.set([]);
        fixture.componentInstance.loading.set(true);
        await fixture.whenStable();

        const rows: HTMLElement[] = findBodyRows(root);
        expect(rows).toHaveLength(1);
        expect(rows[0]?.textContent).not.toContain('Nothing found.');
        expect(rows[0]?.classList.contains('absolute')).toBe(false);
        expect(rows[0]?.querySelector('td')?.getAttribute('colspan')).toBe('5');
        expect(rows[0]?.querySelector('[role="progressbar"]')).not.toBeNull();
    });

    test('shows the footer below the rows while it has rows or filters, and the select of the page size while it changes something', async () => {
        const [fixture, root] = await render();
        expect(root.querySelector('ui-table > ui-table-footer nav')).not.toBeNull();
        expect(root.querySelector('ui-table > ui-table-footer ui-input-select')).not.toBeNull();

        // every row fits on the smallest page
        fixture.componentInstance.totalAmount.set(2);
        await fixture.whenStable();
        expect(root.querySelector('ui-table nav')).toBeNull();
        expect(root.querySelector('ui-table > ui-table-footer ui-input-select')).toBeNull();
        expect(root.querySelector('ui-table > ui-table-footer [role="status"]')?.textContent?.trim()).toBe('Showing 1–2 of 2');

        fixture.componentInstance.totalAmount.set(0);
        await fixture.whenStable();
        expect(root.querySelector('ui-table > ui-table-footer')).toBeNull();

        fixture.componentInstance.filters.set({ name: 'a' });
        await fixture.whenStable();
        expect(findFilterBadgeTexts(root)).toEqual(['Name: a']);
        expect(root.querySelector('ui-table > ui-table-footer [role="status"]')).toBeNull();
    });
});
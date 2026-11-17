import { Component, inject, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';
import { TABLE_CONFIG } from '@service-soft/ui/table';
import { Meta, StoryObj } from '@storybook/angular';

import { LocalTableColumn } from './local-table-column.model';
import { LocalTableComponent } from './local-table.component';

type Order = {
    number: string,
    customer: string,
    date: Date,
    total: number,
    paid: boolean
};

const CUSTOMERS: string[] = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton'];

const ORDERS: Order[] = Array.from({ length: 17 }, (_, index) => ({
    number: `A-${index + 1}`,
    customer: CUSTOMERS[index % CUSTOMERS.length] ?? '',
    date: new Date(2026, (index * 5) % 12, ((index * 7) % 28) + 1),
    total: ((index * 37) % 200) + 10,
    paid: index % 4 !== 0
}));

const DATE_FORMAT: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const PRICE_FORMAT: Intl.NumberFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' });

// the dates and the totals are formatted, so their texts don't order: their columns compare the values instead.
const COLUMNS: LocalTableColumn<Order>[] = [
    { key: 'number', label: 'Number', value: order => order.number, sortable: true },
    { key: 'customer', label: 'Customer', value: order => order.customer, sortable: true, filter: { type: 'text' } },
    {
        key: 'date',
        label: 'Date',
        value: order => DATE_FORMAT.format(order.date),
        sortable: true,
        compare: (a, b) => a.date.getTime() - b.date.getTime()
    },
    {
        key: 'total',
        label: 'Total',
        value: order => PRICE_FORMAT.format(order.total),
        sortable: true,
        align: 'end',
        compare: (a, b) => a.total - b.total
    },
    {
        key: 'paid',
        label: 'Paid',
        value: order => order.paid ? 'Yes' : 'No',
        filter: { type: 'select', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] }
    }
];

// deletes rows for real, to show the table staying on a page that still has rows. The selected rows, of every page, can
// be marked as paid or deleted together. Rows are kept by their number, so a row marked as paid stays selected.
@Component({
    selector: 'ui-order-table',
    template: `
        <div class="mb-3 flex flex-wrap gap-2">
            <button ui-button type="button" variant="outlined" size="sm" [disabled]="selected().length === 0" (click)="markSelectedPaid()">
                Mark as paid
            </button>
            <button ui-button type="button" variant="outlined" size="sm" [disabled]="selected().length === 0" (click)="deleteSelected()">
                Delete selected
            </button>
        </div>
        <ui-local-table label="Orders" selectable [columns]="columns" [rows]="orders()" [rowKey]="getNumber" [actions]="actions"
            [pageSize]="pageSize()" [(selected)]="selected" />
        <ng-template #actions let-order>
            <button ui-button type="button" variant="text" size="sm" (click)="delete(order)">Delete</button>
        </ng-template>
        <p class="mt-4 text-body-sm text-on-surface-variant" role="status">
            {{ orders().length }} orders, {{ selected().length }} selected.
        </p>
    `,
    imports: [LocalTableComponent, ButtonComponent]
})
class OrderTableComponent {
    // the page size of the config, like a table that isn't given one
    readonly pageSize: InputSignal<number> = input(inject(TABLE_CONFIG).pageSize);
    readonly columns: LocalTableColumn<Order>[] = COLUMNS;
    readonly orders: WritableSignal<Order[]> = signal(ORDERS);
    readonly selected: WritableSignal<Order[]> = signal([]);

    readonly getNumber: (order: Order) => string = order => order.number;

    delete(order: Order): void {
        this.orders.update(orders => orders.filter(candidate => candidate.number !== order.number));
        this.selected.update(selected => selected.filter(candidate => candidate.number !== order.number));
    }

    deleteSelected(): void {
        const numbers: Set<string> = new Set(this.selected().map(this.getNumber));
        this.orders.update(orders => orders.filter(order => !numbers.has(order.number)));
        this.selected.set([]);
    }

    markSelectedPaid(): void {
        const numbers: Set<string> = new Set(this.selected().map(this.getNumber));
        this.orders.update(orders => orders.map(order => numbers.has(order.number) ? { ...order, paid: true } : order));
        this.selected.update(selected => selected.map(order => ({ ...order, paid: true })));
    }
}

const meta: Meta<LocalTableComponent<Order>> = {
    title: 'UI/Local table',
    component: LocalTableComponent
};
export default meta;

type Story = StoryObj<LocalTableComponent<Order>>;

export const Default: Story = {
    render: () => ({ template: '<ui-order-table />', moduleMetadata: { imports: [OrderTableComponent] } })
};

// every row on one page, so the pagination doesn't show.
export const OnePage: Story = {
    render: () => ({ template: '<ui-order-table [pageSize]="25" />', moduleMetadata: { imports: [OrderTableComponent] } })
};
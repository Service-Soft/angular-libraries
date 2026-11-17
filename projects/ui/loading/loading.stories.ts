import { ButtonComponent } from '@service-soft/ui/button';
import { CardComponent } from '@service-soft/ui/card';
import { DataListComponent } from '@service-soft/ui/data-list';
import { TableColumn, TableComponent } from '@service-soft/ui/table';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { LoadingDirective } from './loading.directive';

/**
 * A customer, a row of the table of a story.
 */
type Customer = {
    /**
     * The name.
     */
    name: string,
    /**
     * The city.
     */
    city: string
};

const CUSTOMERS: Customer[] = [
    { name: 'Ada Lovelace', city: 'London' },
    { name: 'Grace Hopper', city: 'New York' },
    { name: 'Alan Turing', city: 'Manchester' }
];

const COLUMNS: TableColumn<Customer>[] = [
    { key: 'name', label: 'Name', value: customer => customer.name },
    { key: 'city', label: 'City', value: customer => customer.city }
];

const meta: Meta<LoadingDirective> = {
    title: 'UI/Loading',
    component: LoadingDirective,
    decorators: [moduleMetadata({ imports: [ButtonComponent, CardComponent, DataListComponent, LoadingDirective, TableComponent] })],
    render: args => ({
        props: args,
        template: `
            <ui-card class="max-w-sm" [uiLoading]="uiLoading" [loadingLabel]="loadingLabel">
                <h2 class="mb-2 font-heading text-title">Orders</h2>
                <p class="mb-3 text-body">12 orders are waiting to be shipped.</p>
                <button ui-button type="button" variant="outlined" size="sm">Show orders</button>
            </ui-card>
        `
    }),
    argTypes: {
        uiLoading: { control: 'boolean' }
    },
    args: {
        uiLoading: true,
        loadingLabel: 'Loading orders'
    }
};
export default meta;

type Story = StoryObj<LoadingDirective>;

// over a card, with its corners. Its button can't be clicked or focused while the card loads.
export const OnACard: Story = {};

// over a table, while the buttons next to it stay usable.
export const OnATable: Story = {
    render: () => ({
        props: { columns: COLUMNS, rows: CUSTOMERS },
        template: `
            <div class="flex max-w-xl flex-col items-start gap-4">
                <ui-table class="w-full" label="Customers" uiLoading [columns]="columns" [rows]="rows" [totalAmount]="3" />
                <button ui-button type="button">Still usable</button>
            </div>
        `
    })
};

// next to areas that don't load: only the one that does is covered.
export const OneOfSeveral: Story = {
    render: () => ({
        props: { lastSeen: new Date(2026, 10, 12, 9, 30) },
        template: `
            <div class="grid max-w-3xl gap-4 sm:grid-cols-2">
                <ui-card [uiLoading]="true">
                    <h2 class="mb-4 font-heading text-title">Customer</h2>
                    <ui-data-list [items]="[{ label: 'Customer number', value: 'MM-42' }, { label: 'Last seen', value: lastSeen }]" />
                </ui-card>
                <ui-card>
                    <h2 class="mb-2 font-heading text-title">Revenue</h2>
                    <p class="text-body">€98,765.40 this month</p>
                </ui-card>
            </div>
        `
    })
};
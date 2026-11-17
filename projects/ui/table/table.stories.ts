import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, linkedSignal, signal, Signal, TemplateRef, viewChild, WritableSignal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';
import { EmptyStateActionsComponent, EmptyStateComponent } from '@service-soft/ui/empty-state';
import { InputOption } from '@service-soft/ui/input';
import { Meta, StoryObj } from '@storybook/angular';

import { TableActionsComponent } from './table-actions.component';
import { TableCellContext } from './table-cell-context.model';
import { TableColumn } from './table-column.model';
import { TABLE_CONFIG } from './table-config.provider';
import { TableFilters } from './table-filters.type';
import { TableOrder } from './table-order.model';
import { TableVariant } from './table-variant.type';
import { TableComponent } from './table.component';

type CustomerStatus = 'Active' | 'Paused';

type Customer = {
    id: number,
    name: string,
    city: string,
    orders: number,
    status: CustomerStatus
};

const NAMES: string[] = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton', 'Ken Thompson'];
const CITIES: string[] = ['Berlin', 'Hamburg', 'Munich', 'Cologne'];
const STATUSES: InputOption<CustomerStatus>[] = [{ label: 'Active', value: 'Active' }, { label: 'Paused', value: 'Paused' }];

const CUSTOMERS: Customer[] = Array.from({ length: 23 }, (_, index) => ({
    id: index + 1,
    name: `${NAMES[index % NAMES.length]} ${Math.floor(index / NAMES.length) + 1}`,
    city: CITIES[index % CITIES.length] ?? '',
    orders: (index * 7) % 30,
    status: index % 3 === 0 ? 'Paused' : 'Active'
}));

// pages, orders and filters the customers like a backend, which the table leaves to whoever gives it its rows.
@Component({
    selector: 'ui-customer-table',
    templateUrl: './table.stories.html',
    imports: [TableComponent, TableActionsComponent, ButtonComponent]
})
class CustomerTableComponent {
    readonly label: InputSignal<string> = input('Customers');
    readonly required: InputSignal<boolean> = input(false);
    readonly invalid: InputSignal<boolean> = input(false);
    readonly withContent: InputSignal<boolean> = input(false);
    readonly selectable: InputSignal<boolean> = input(true);
    readonly opens: InputSignal<boolean> = input(true);
    readonly withActions: InputSignal<boolean> = input(true);
    readonly withFilters: InputSignal<boolean> = input(true);
    readonly empty: InputSignal<boolean> = input(false);
    readonly loading: InputSignal<boolean> = input(false);
    readonly variant: InputSignal<TableVariant> = input<TableVariant>('outlined');
    readonly striped: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    readonly initialFilters: InputSignal<TableFilters> = input<TableFilters>({});

    readonly page: WritableSignal<number> = signal(1);
    readonly order: WritableSignal<TableOrder | undefined> = signal(undefined);
    readonly filters: WritableSignal<TableFilters> = linkedSignal(() => this.initialFilters());
    readonly selected: WritableSignal<Customer[]> = signal([]);
    readonly said: WritableSignal<string> = signal('');

    readonly statusClasses: Record<CustomerStatus, string> = {
        Active: 'font-semibold text-success-text',
        Paused: 'text-on-surface-variant'
    };

    // starts at the page size of the config, like a table that isn't given one
    readonly pageSize: WritableSignal<number> = signal(inject(TABLE_CONFIG).pageSize);

    private readonly status: Signal<TemplateRef<TableCellContext<Customer>> | undefined> = viewChild('status');

    readonly columns: Signal<TableColumn<Customer>[]> = computed(() => [
        {
            key: 'name',
            label: 'Name',
            value: customer => customer.name,
            sortable: true,
            filter: this.withFilters() ? { type: 'text' } : undefined
        },
        { key: 'city', label: 'City', value: customer => customer.city, sortable: true },
        { key: 'orders', label: 'Orders', value: customer => String(customer.orders), sortable: true, align: 'end' },
        {
            key: 'status',
            label: 'Status',
            value: customer => customer.status,
            cell: this.status(),
            filter: this.withFilters() ? { type: 'select', options: STATUSES } : undefined
        }
    ]);

    readonly matching: Signal<Customer[]> = computed(() => {
        const filters: TableFilters = this.filters();
        const name: unknown = filters['name'];
        return (this.empty() ? [] : CUSTOMERS)
            .filter(customer => typeof name !== 'string' || customer.name.toLowerCase().includes(name.toLowerCase()))
            .filter(customer => filters['status'] == undefined || customer.status === filters['status']);
    });

    readonly rows: Signal<Customer[]> = computed(() => {
        const order: TableOrder | undefined = this.order();
        const value: ((customer: Customer) => string) | undefined = this.columns().find(column => column.key === order?.key)?.value;
        const sorted: Customer[] = value == undefined
            ? this.matching()
            : [...this.matching()].sort((a, b) => {
                const compared: number = value(a).localeCompare(value(b), undefined, { numeric: true });
                return order?.direction === 'DESC' ? -compared : compared;
            });
        return sorted.slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize());
    });

    readonly getId: (customer: Customer) => number = customer => customer.id;
}

// the controls of the default story, which are inputs of the table of customers rather than of the table itself
type TableStoryArgs = {
    variant: TableVariant,
    striped: boolean,
    selectable: boolean,
    opens: boolean,
    withActions: boolean,
    withFilters: boolean,
    loading: boolean,
    empty: boolean
};

const meta: Meta<TableStoryArgs> = {
    title: 'UI/Table',
    component: TableComponent
};
export default meta;

type Story = StoryObj<TableStoryArgs>;

// selection, actions, rows that open, ordering and filters, outlined. Its controls switch each of them.
export const Default: Story = {
    argTypes: {
        variant: { control: 'inline-radio', options: ['flat', 'outlined', 'card'] },
        striped: { control: 'boolean' },
        selectable: { control: 'boolean' },
        opens: { control: 'boolean' },
        withActions: { control: 'boolean' },
        withFilters: { control: 'boolean' },
        loading: { control: 'boolean' },
        empty: { control: 'boolean' }
    },
    args: {
        variant: 'outlined',
        striped: false,
        selectable: true,
        opens: true,
        withActions: true,
        withFilters: true,
        loading: false,
        empty: false
    },
    render: args => ({
        props: args,
        template: `
            <ui-customer-table
                [variant]="variant"
                [striped]="striped"
                [selectable]="selectable"
                [opens]="opens"
                [withActions]="withActions"
                [withFilters]="withFilters"
                [loading]="loading"
                [empty]="empty"
            />
        `,
        moduleMetadata: { imports: [CustomerTableComponent] }
    })
};

// no frame, only the header and the footer set apart.
export const Flat: Story = {
    render: () => ({ template: '<ui-customer-table variant="flat" />', moduleMetadata: { imports: [CustomerTableComponent] } })
};

// raised from the page like a card.
export const Card: Story = {
    render: () => ({ template: '<ui-customer-table variant="card" />', moduleMetadata: { imports: [CustomerTableComponent] } })
};

// every second row set apart, in each variant. Each table has a label of its own, which names its pagination.
export const Striped: Story = {
    render: () => ({
        template: `
            <div class="flex flex-col gap-8">
                <ui-customer-table striped variant="outlined" label="Outlined customers" />
                <ui-customer-table striped variant="flat" label="Flat customers" />
                <ui-customer-table striped variant="card" label="Card customers" />
            </div>
        `,
        moduleMetadata: { imports: [CustomerTableComponent] }
    })
};

// only the values, ordered by some columns.
export const Plain: Story = {
    render: () => ({
        template: '<ui-customer-table [selectable]="false" [opens]="false" [withActions]="false" [withFilters]="false" />',
        moduleMetadata: { imports: [CustomerTableComponent] }
    })
};

// the filtered columns have a dot on the button of their filter, and the notice below the table says what they are.
export const Filtered: Story = {
    render: () => ({
        template: '<ui-customer-table [initialFilters]="{ name: \'a\', status: \'Paused\' }" />',
        moduleMetadata: { imports: [CustomerTableComponent] }
    })
};

// a button next to the label, and a description below it, both in the frame of the table.
export const WithContent: Story = {
    render: () => ({
        template: '<ui-customer-table [withContent]="true" />',
        moduleMetadata: { imports: [CustomerTableComponent] }
    })
};

// a table of a form that needs a row: its label is marked as required, and its frame is red while it has none, in each
// variant. Each table has a label of its own, which names its pagination.
export const RequiredInvalid: Story = {
    render: () => ({
        template: `
            <div class="flex flex-col gap-8">
                <ui-customer-table [required]="true" [invalid]="true" [empty]="true" variant="outlined" label="Outlined customers" />
                <ui-customer-table [required]="true" [invalid]="true" [empty]="true" variant="flat" label="Flat customers" />
                <ui-customer-table [required]="true" [invalid]="true" [empty]="true" variant="card" label="Card customers" />
            </div>
        `,
        moduleMetadata: { imports: [CustomerTableComponent] }
    })
};

export const Empty: Story = {
    render: () => ({ template: '<ui-customer-table [empty]="true" />', moduleMetadata: { imports: [CustomerTableComponent] } })
};

// an empty state of the app in place of the one of the table, with what the user can do about it.
export const OwnEmptyState: Story = {
    render: () => ({
        props: { columns: [{ key: 'name', label: 'Name', value: () => '' }, { key: 'city', label: 'City', value: () => '' }] },
        template: `
            <ui-table class="max-w-xl" label="Customers" variant="outlined" [columns]="columns" [rows]="[]" [totalAmount]="0">
                <ui-empty-state size="compact" title="No customers yet" text="Customers show here once they signed up.">
                    <ui-empty-state-actions><button ui-button type="button" size="sm">Add a customer</button></ui-empty-state-actions>
                </ui-empty-state>
            </ui-table>
        `,
        moduleMetadata: { imports: [TableComponent, EmptyStateComponent, EmptyStateActionsComponent, ButtonComponent] }
    })
};

// the spinner covers the rows of the last page while the next one loads, so the table keeps its height.
export const Loading: Story = {
    render: () => ({ template: '<ui-customer-table [loading]="true" />', moduleMetadata: { imports: [CustomerTableComponent] } })
};

// the first page loads, so there are no rows yet: the spinner takes the place of the text that says so.
export const LoadingWithoutRows: Story = {
    render: () => ({
        template: '<ui-customer-table [empty]="true" [loading]="true" />',
        moduleMetadata: { imports: [CustomerTableComponent] }
    })
};
import { LinkComponent } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { DataListComponent } from './data-list.component';

const meta: Meta<DataListComponent> = {
    title: 'UI/Data list',
    component: DataListComponent,
    decorators: [moduleMetadata({ imports: [LinkComponent] })]
};
export default meta;

type Story = StoryObj<DataListComponent>;

// the template is given as the value of an item, so it keeps its place in the list.
const TEMPLATE: string = `
    <ng-template #links>
        <ul class="grid gap-1">
            <li><a ui-link href="https://example.com">Website</a></li>
            <li><a ui-link href="https://example.com/shop">Shop</a></li>
        </ul>
    </ng-template>
    <ui-data-list
        [items]="[
            { label: 'Customer number', value: 'MM-42' },
            { label: 'Birthday', value: birthday },
            { label: 'Last seen', value: lastSeen, dateFormat: { dateStyle: 'medium', timeStyle: 'short' } },
            { label: 'Orders', value: 1234 },
            { label: 'Revenue', value: 98765.4, numberFormat: { style: 'currency', currency: 'EUR' } },
            { label: 'Notes', value: undefined },
            { label: 'Links', value: links }
        ]"
    />
`;

const PROPS: Record<string, Date> = {
    birthday: new Date(1990, 4, 17),
    lastSeen: new Date(2026, 10, 12, 9, 30)
};

export const Default: Story = {
    render: () => ({
        props: PROPS,
        template: `<div class="max-w-xl">${TEMPLATE}</div>`
    })
};

// too narrow for labels next to their values, like in a small dialog, so each stands above its value.
export const Narrow: Story = {
    render: () => ({
        props: PROPS,
        template: `<div class="max-w-60">${TEMPLATE}</div>`
    })
};

// a value without spaces wraps instead of widening the list.
export const LongValues: Story = {
    render: () => ({
        template: `
            <div class="max-w-md">
                <ui-data-list
                    [items]="[
                        { label: 'Description', value: 'Orders ship within two working days, and every order can be returned within 30 days of its delivery.' },
                        { label: 'Callback url', value: 'https://example.com/api/webhooks/orders/created/with/a/very/long/path' }
                    ]"
                />
            </div>
        `
    })
};

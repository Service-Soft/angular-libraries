import { LOCALE_ID } from '@angular/core';
import { CardComponent } from '@service-soft/ui/card';
import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { OrderSummaryDiscount } from './order-summary-discount.model';
import { OrderSummaryItem } from './order-summary-item.model';
import { OrderSummaryComponent } from './order-summary.component';

const RADIO: 'inline-radio' = 'inline-radio';

// a booking in Germany: the room has the reduced rate, breakfast and parking the standard one.
const BOOKING: OrderSummaryItem[] = [
    { label: 'Double room', description: 'Fri, 12 Jun – Sun, 14 Jun', quantity: 2, unitPrice: 8900, taxRate: 7 },
    { label: 'Breakfast', description: 'For two', quantity: 2, unitPrice: 3000, taxRate: 19 },
    { label: 'Parking space', quantity: 1, unitPrice: 1200, taxRate: 19 }
];

const DISCOUNTS: OrderSummaryDiscount[] = [
    { label: 'Members 10 %', type: 'percentage', value: 10 },
    { label: 'Voucher SUMMER', type: 'amount', value: 500 }
];

// an order of a business, with net prices.
const INVOICE: OrderSummaryItem[] = [
    { label: 'Workshop', description: 'Half a day, on site', quantity: 1, unitPrice: 120000 },
    { label: 'Consulting', description: 'In hours', quantity: 2.5, unitPrice: 14000 },
    { label: 'Travel expenses', quantity: 1, unitPrice: 8640 }
];

const meta: Meta<OrderSummaryComponent> = {
    title: 'Ecommerce/Order summary',
    component: OrderSummaryComponent,
    decorators: [moduleMetadata({ imports: [CardComponent] })],
    argTypes: {
        variant: { control: RADIO, options: ['compact', 'detailed'] },
        taxMode: { control: RADIO, options: ['gross', 'net'] },
        currency: { control: RADIO, options: ['EUR', 'USD', 'JPY'] }
    },
    args: {
        variant: 'compact',
        taxMode: 'gross',
        currency: 'EUR'
    },
    render: args => ({
        props: { ...args, items: BOOKING, discounts: DISCOUNTS },
        template: `
            <ui-card class="max-w-xl">
                <h2 class="mb-4 font-heading text-title">Your booking</h2>
                <ngx-order-summary [items]="items" [discounts]="discounts" [variant]="variant" [taxMode]="taxMode" [currency]="currency" />
            </ui-card>
        `
    })
};
export default meta;

type Story = StoryObj<OrderSummaryComponent>;

export const Playground: Story = {};

// like in the sidebar of a checkout: each item with its quantity and total. Gross prices say below the total what
// they include of each tax.
export const Compact: Story = {
    render: () => ({
        props: { items: BOOKING },
        template: `
            <ui-card class="max-w-sm">
                <h2 class="mb-4 font-heading text-title">Your booking</h2>
                <ngx-order-summary [items]="items" />
            </ui-card>
        `
    })
};

// a column each for the quantity and the unit price, the descriptions of the items and the net total.
export const Detailed: Story = {
    render: () => ({
        props: { items: BOOKING, discounts: DISCOUNTS },
        template: `
            <ui-card class="max-w-2xl">
                <h2 class="mb-4 font-heading text-title">Your booking</h2>
                <ngx-order-summary variant="detailed" [items]="items" [discounts]="discounts" />
            </ui-card>
        `
    })
};

// net prices, which the tax is added to before the total, like for a business.
export const NetPrices: Story = {
    render: () => ({
        props: { items: INVOICE },
        template: `
            <ui-card class="max-w-2xl">
                <h2 class="mb-4 font-heading text-title">Quote</h2>
                <ngx-order-summary variant="detailed" taxMode="net" [taxRate]="19" [items]="items" />
            </ui-card>
        `
    })
};

// items without a rate aren't taxed, and a total without discounts or taxes shows no subtotal.
export const WithoutTax: Story = {
    render: () => ({
        props: { items: [{ label: 'Gift card', quantity: 2, unitPrice: 2500 }, { label: 'Gift wrap', quantity: 1, unitPrice: 300 }] },
        template: '<div class="max-w-sm"><ngx-order-summary [items]="items" /></div>'
    })
};

// amounts and rates in the format of the language of the app.
export const German: Story = {
    decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'de' }] })],
    render: () => ({
        props: { items: BOOKING, discounts: DISCOUNTS },
        template: '<div class="max-w-xl"><ngx-order-summary variant="detailed" [items]="items" [discounts]="discounts" /></div>'
    })
};

// the labels wrap on a small phone, the amounts stay in one piece.
export const Narrow: Story = {
    render: () => ({
        props: { items: BOOKING, discounts: DISCOUNTS },
        template: '<div class="max-w-72"><ngx-order-summary variant="detailed" [items]="items" [discounts]="discounts" /></div>'
    })
};
import { Meta, StoryObj } from '@storybook/angular';

import { PriceComponent } from './price.component';

const meta: Meta<PriceComponent> = {
    title: 'UI/Price',
    component: PriceComponent,
    argTypes: {
        size: { control: 'inline-radio', options: ['md', 'lg'] }
    },
    args: {
        amount: 49,
        period: 'month',
        oldAmount: 59,
        currency: 'EUR',
        size: 'md'
    },
    render: args => ({
        props: args,
        template: '<ui-price [amount]="amount" [period]="period" [oldAmount]="oldAmount" [currency]="currency" [size]="size" />'
    })
};
export default meta;

type Story = StoryObj<PriceComponent>;

export const Playground: Story = {};

// a single payment, a price per period and a discount, in both sizes.
export const Variants: Story = {
    render: () => ({
        template: `
            <div class="grid justify-items-start gap-6">
                <ui-price [amount]="120" />
                <ui-price [amount]="9.99" period="month" />
                <ui-price [amount]="49" period="month" [oldAmount]="59" [format]="{ maximumFractionDigits: 0 }" />
                <ui-price size="lg" [amount]="120" period="year" />
                <ui-price size="lg" currency="USD" [amount]="49" period="month" [oldAmount]="59" />
            </div>
        `
    })
};

// where it is narrow, the period and the old price wrap below the amount.
export const Narrow: Story = {
    render: () => ({
        template: `
            <div class="w-40">
                <ui-price size="lg" [amount]="1490" period="year, paid once" [oldAmount]="1790" />
            </div>
        `
    })
};
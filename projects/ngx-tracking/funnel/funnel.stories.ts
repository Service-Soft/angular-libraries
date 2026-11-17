import { Meta, StoryObj } from '@storybook/angular';

import { FunnelComponent } from './funnel.component';

const meta: Meta<FunnelComponent> = {
    title: 'Tracking/Funnel',
    component: FunnelComponent,
    args: {
        funnelPoints: [
            { name: 'Visit', value: 1840 },
            { name: 'Product page', value: 920 },
            { name: 'Add to cart', value: 310 },
            { name: 'Checkout', value: 140 },
            { name: 'Purchase', value: 96 }
        ]
    },
    render: args => ({
        props: args,
        template: `
            <h2 class="mb-4 font-heading text-title">Checkout</h2>
            <ngx-funnel class="max-w-xl" [funnelPoints]="funnelPoints" />
        `
    })
};
export default meta;

type Story = StoryObj<FunnelComponent>;

export const Default: Story = {};

// a step nobody reached is still listed, with an empty shape.
export const Empty: Story = {
    args: { funnelPoints: [{ name: 'Visit', value: 0 }, { name: 'Purchase', value: 0 }] }
};
import { ButtonComponent } from '@service-soft/ui/button';
import { DataListComponent } from '@service-soft/ui/data-list';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { CardColor } from './card-color.type';
import { CardVariant } from './card-variant.type';
import { CardComponent } from './card.component';

const meta: Meta<CardComponent> = {
    title: 'UI/Card',
    component: CardComponent,
    decorators: [moduleMetadata({ imports: [DataListComponent, ButtonComponent] })],
    argTypes: {
        variant: { control: 'inline-radio', options: ['elevated', 'outlined', 'filled'] },
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary'] }
    },
    args: {
        variant: 'elevated',
        color: 'neutral'
    },
    render: args => ({
        props: args,
        template: `
            <ui-card class="max-w-sm" [variant]="variant" [color]="color">
                <h2 class="mb-2 font-heading text-title">Orders</h2>
                <p class="text-body">12 orders are waiting to be shipped.</p>
            </ui-card>
        `
    })
};
export default meta;

type Story = StoryObj<CardComponent>;

export const Playground: Story = {};

const VARIANTS: CardVariant[] = ['elevated', 'outlined', 'filled'];
const COLORS: CardColor[] = ['neutral', 'primary', 'secondary'];

// every variant in every color, with a button, which a filled card in a color draws in the on- color of it.
export const Variants: Story = {
    render: () => ({
        props: { variants: VARIANTS, colors: COLORS },
        template: `
            <div class="grid max-w-3xl gap-4 sm:grid-cols-3">
                @for (color of colors; track color) {
                    @for (variant of variants; track variant) {
                        <ui-card [variant]="variant" [color]="color">
                            <h2 class="mb-2 font-heading text-title">{{ variant }} {{ color }}</h2>
                            <p class="mb-3 text-body">12 orders are waiting to be shipped.</p>
                            <button ui-button type="button" variant="outlined" size="sm">Show orders</button>
                        </ui-card>
                    }
                }
            </div>
        `
    })
};

// the widgets of a dashboard: the grid places the cards, each with a heading of the level of the page.
export const Dashboard: Story = {
    render: () => ({
        props: { lastSeen: new Date(2026, 10, 12, 9, 30) },
        template: `
            <div class="grid gap-4 md:grid-cols-12">
                <ui-card class="md:col-span-4">
                    <h2 class="mb-2 font-heading text-title">Orders</h2>
                    <p class="text-body">12 waiting to be shipped</p>
                </ui-card>
                <ui-card class="md:col-span-4">
                    <h2 class="mb-2 font-heading text-title">Returns</h2>
                    <p class="text-body">3 to check</p>
                </ui-card>
                <ui-card class="md:col-span-4">
                    <h2 class="mb-2 font-heading text-title">Revenue</h2>
                    <p class="text-body">€98,765.40 this month</p>
                </ui-card>
                <ui-card class="md:col-span-12">
                    <h2 class="mb-4 font-heading text-title">Customer</h2>
                    <ui-data-list
                        [items]="[
                            { label: 'Customer number', value: 'MM-42' },
                            { label: 'Last seen', value: lastSeen, dateFormat: { dateStyle: 'medium', timeStyle: 'short' } },
                            { label: 'Orders', value: 1234 }
                        ]"
                    />
                </ui-card>
            </div>
        `
    })
};

// flush, the content goes up to the edges and brings its own padding, like a band of color at the top.
export const Flush: Story = {
    render: () => ({
        template: `
            <ui-card class="max-w-sm" flush>
                <div class="rounded-ss-card rounded-se-card bg-surface-container p-4 text-label text-on-surface">Spring 2026</div>
                <div class="p-4 sm:p-6">
                    <h2 class="mb-2 font-heading text-title">Orders</h2>
                    <p class="text-body">12 orders are waiting to be shipped.</p>
                </div>
            </ui-card>
        `
    })
};
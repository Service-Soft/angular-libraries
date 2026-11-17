import { CardComponent } from '@service-soft/ui/card';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { StatComponent } from './stat.component';

const meta: Meta<StatComponent> = {
    title: 'UI/Stat',
    component: StatComponent,
    decorators: [moduleMetadata({ imports: [CardComponent] })],
    argTypes: {
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary'] }
    },
    args: {
        value: 1200,
        label: 'Members',
        prefix: '+',
        suffix: '',
        color: 'primary',
        duration: 1500
    },
    render: args => ({
        props: args,
        template: `
            <ui-stat [value]="value" [label]="label" [prefix]="prefix" [suffix]="suffix" [color]="color" [duration]="duration" />
        `
    })
};
export default meta;

type Story = StoryObj<StatComponent>;

export const Playground: Story = {};

// stats side by side are a grid of your own, here centered and each on a card.
export const Grid: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-4xl gap-4 text-center sm:grid-cols-2 lg:grid-cols-4">
                <ui-card><ui-stat label="Members" prefix="+" [value]="1200" /></ui-card>
                <ui-card><ui-stat label="Departments" [value]="12" /></ui-card>
                <ui-card><ui-stat label="Years of history" [value]="105" /></ui-card>
                <ui-card><ui-stat label="Would recommend us" suffix=" %" [value]="98.5" [format]="{ maximumFractionDigits: 1 }" /></ui-card>
            </div>
        `
    })
};

// the formats of Intl: fraction digits, compact numbers and a currency.
export const Formats: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-4xl gap-8 sm:grid-cols-3">
                <ui-stat label="Average rating" [value]="4.8" [format]="{ minimumFractionDigits: 1 }" />
                <ui-stat label="Visitors a year" [value]="1250000" [format]="{ notation: 'compact' }" />
                <ui-stat
                    label="Raised for the new hall"
                    [value]="48500"
                    [format]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
                />
            </div>
        `
    })
};

export const Colors: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-4xl gap-8 sm:grid-cols-3">
                <ui-stat color="neutral" label="Neutral" [value]="1200" />
                <ui-stat color="primary" label="Primary" [value]="1200" />
                <ui-stat color="secondary" label="Secondary" [value]="1200" />
            </div>
        `
    })
};

// on a colored surface, the number and its label take its on- colors.
export const OnColoredSurface: Story = {
    render: () => ({
        template: `
            <div class="surface-primary max-w-4xl p-8">
                <div class="grid gap-8 text-center sm:grid-cols-3">
                    <ui-stat label="Members" prefix="+" [value]="1200" />
                    <ui-stat label="Departments" [value]="12" />
                    <ui-stat label="Coaches" [value]="64" />
                </div>
            </div>
        `
    })
};
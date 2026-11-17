import { Meta, StoryObj } from '@storybook/angular';

import { InputSliderComponent } from './input-slider.component';

const meta: Meta<InputSliderComponent> = {
    title: 'UI/Input slider',
    component: InputSliderComponent,
    argTypes: {
        min: { control: 'number' },
        max: { control: 'number' },
        step: { control: 'number' },
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary', 'success'] },
        disabled: { control: 'boolean' }
    },
    args: {
        min: 0,
        max: 10,
        step: 1,
        color: 'primary',
        disabled: false
    },
    render: args => ({
        props: { ...args, value: 7 },
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-slider
                    label="Volume"
                    hint="0 is silent"
                    [min]="min"
                    [max]="max"
                    [step]="step"
                    [color]="color"
                    [disabled]="disabled"
                    [(value)]="value"
                />
                <p class="text-body-sm text-on-surface-variant">Value: {{ value }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputSliderComponent>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        props: {
            validateHonest: (value: number) => value === 5 ? 'Nobody is perfect.' : undefined
        },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-slider label="Brightness" [value]="80" />
                <ui-input-slider label="Price" hint="In steps of 5 €" [min]="0" [max]="200" [step]="5" [value]="45" />
                <ui-input-slider label="Disabled" disabled [value]="30" />
                <ui-input-slider
                    label="Rating"
                    [min]="1"
                    [max]="5"
                    [value]="5"
                    [customValidation]="validateHonest"
                    [showValidationError]="true"
                />
            </div>
        `
    })
};

// the filled part of the track and the thumb in each color.
export const Colors: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-2">
                @for (color of ['neutral', 'primary', 'secondary', 'success']; track color) {
                    <ui-input-slider [label]="color" [color]="color" [value]="60" />
                }
            </div>
        `
    })
};
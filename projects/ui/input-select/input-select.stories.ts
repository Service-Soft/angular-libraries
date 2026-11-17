import { InputOption } from '@service-soft/ui/input';
import { Meta, StoryObj } from '@storybook/angular';

import { InputSelectComponent } from './input-select.component';

const SIZES: InputOption<string>[] = [
    { label: 'Small', value: 'S' },
    { label: 'Medium', value: 'M' },
    { label: 'Large', value: 'L' },
    { label: 'Extra large', value: 'XL', disabled: true }
];

const meta: Meta<InputSelectComponent<string>> = {
    title: 'UI/Input select',
    component: InputSelectComponent,
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        size: 'md',
        required: true,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, options: SIZES, value: 'M' },
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-select
                    label="Shirt size"
                    hint="Extra large is sold out"
                    placeholder="Choose a size"
                    [options]="options"
                    [size]="size"
                    [required]="required"
                    [disabled]="disabled"
                    [readonly]="readonly"
                    [(value)]="value"
                />
                <p class="text-body-sm text-on-surface-variant">Value: {{ value }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputSelectComponent<string>>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        props: { options: SIZES },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-select label="Empty" placeholder="Choose a size" [required]="false" [options]="options" />
                <ui-input-select label="Chosen" value="M" [options]="options" />
                <ui-input-select label="Read only" value="M" readonly [options]="options" />
                <ui-input-select label="Disabled" value="M" disabled [options]="options" />
            </div>
        `
    })
};

// the native validation of the browser, with the errors shown right away instead of once the user left a field.
export const Validation: Story = {
    render: () => ({
        props: {
            options: SIZES,
            validateInStock: (value: string | undefined) => value === 'L' ? 'Large is back next week.' : undefined
        },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-select label="Shirt size" placeholder="Choose a size" [options]="options" [showValidationError]="true" />
                <ui-input-select
                    label="Second shirt"
                    value="L"
                    [options]="options"
                    [customValidation]="validateInStock"
                    [showValidationError]="true"
                />
            </div>
        `
    })
};

export const Sizes: Story = {
    render: () => ({
        props: { options: SIZES },
        template: `
            <div class="grid max-w-80 gap-4">
                @for (size of ['sm', 'md', 'lg']; track size) {
                    <ui-input-select label="Shirt size" value="M" [options]="options" [size]="size" />
                }
            </div>
        `
    })
};
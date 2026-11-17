import { Meta, StoryObj } from '@storybook/angular';

import { InputNumberComponent } from './input-number.component';

const meta: Meta<InputNumberComponent> = {
    title: 'UI/Input number',
    component: InputNumberComponent,
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
        props: { ...args, value: 42 },
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-number
                    label="Age"
                    hint="In years"
                    [min]="0"
                    [size]="size"
                    [required]="required"
                    [disabled]="disabled"
                    [readonly]="readonly"
                    [(value)]="value"
                />
                <p class="text-body-sm text-on-surface-variant">Value: {{ value ?? 'none' }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputNumberComponent>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-number label="Empty" placeholder="12" [required]="false" />
                <ui-input-number label="Filled" [value]="12" />
                <ui-input-number label="Read only" [value]="12" readonly />
                <ui-input-number label="Disabled" [value]="12" disabled />
            </div>
        `
    })
};

// the native validation of the browser, with the errors shown right away instead of once the user left a field.
export const Validation: Story = {
    render: () => ({
        props: {
            validateEven: (value: number | undefined) => value == undefined || value % 2 === 0 ? undefined : 'The number has to be even.'
        },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-number label="Guests" hint="1 to 10" [min]="1" [max]="10" [value]="12" [showValidationError]="true" />
                <ui-input-number label="Price" hint="In euros and cents" [step]="0.01" [value]="9.999" [showValidationError]="true" />
                <ui-input-number label="Seats" [customValidation]="validateEven" [value]="3" [showValidationError]="true" />
                <ui-input-number label="Quantity" [showValidationError]="true" />
            </div>
        `
    })
};
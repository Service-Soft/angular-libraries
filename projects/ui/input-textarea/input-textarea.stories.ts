import { Meta, StoryObj } from '@storybook/angular';

import { InputTextareaComponent } from './input-textarea.component';

const meta: Meta<InputTextareaComponent> = {
    title: 'UI/Input textarea',
    component: InputTextareaComponent,
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        rows: { control: 'number' },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        size: 'md',
        rows: 3,
        required: true,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, value: 'Please ring twice.' },
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-textarea
                    label="Delivery note"
                    hint="Shown to the driver"
                    [size]="size"
                    [rows]="rows"
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

type Story = StoryObj<InputTextareaComponent>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-textarea label="Empty" placeholder="Placeholder" [required]="false" />
                <ui-input-textarea label="Filled" value="A first line.\nAnd a second one." />
                <ui-input-textarea label="Read only" value="Read only" readonly />
                <ui-input-textarea label="Disabled" value="Disabled" disabled />
            </div>
        `
    })
};

// the native validation of the browser, with the errors shown right away instead of once the user left a field.
export const Validation: Story = {
    render: () => ({
        props: {
            validateNoLinks: (value: string) => value.includes('http') ? 'Links can\'t be sent.' : undefined
        },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-textarea label="Message" [showValidationError]="true" />
                <ui-input-textarea
                    label="Review"
                    hint="At least 20 characters"
                    value="Great."
                    [minLength]="20"
                    [showValidationError]="true"
                />
                <ui-input-textarea
                    label="Comment"
                    value="See http://example.com"
                    [customValidation]="validateNoLinks"
                    [showValidationError]="true"
                />
            </div>
        `
    })
};

export const Sizes: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-4">
                @for (size of ['sm', 'md', 'lg']; track size) {
                    <ui-input-textarea label="Note" [required]="false" [size]="size" [rows]="2" />
                }
            </div>
        `
    })
};
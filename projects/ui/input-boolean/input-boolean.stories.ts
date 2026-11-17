import { LinkComponent } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { InputBooleanComponent } from './input-boolean.component';

const RADIO: 'inline-radio' = 'inline-radio';

const meta: Meta<InputBooleanComponent> = {
    title: 'UI/Input boolean',
    component: InputBooleanComponent,
    argTypes: {
        appearance: { control: RADIO, options: ['checkbox', 'switch'] },
        size: { control: RADIO, options: ['sm', 'md', 'lg'] },
        color: { control: RADIO, options: ['neutral', 'primary', 'secondary', 'success'] },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        appearance: 'checkbox',
        size: 'md',
        color: 'primary',
        required: false,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, value: true },
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-boolean
                    label="Send me the newsletter"
                    hint="At most once a month"
                    [appearance]="appearance"
                    [size]="size"
                    [color]="color"
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

type Story = StoryObj<InputBooleanComponent>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-2">
                @for (appearance of ['checkbox', 'switch']; track appearance) {
                    <ui-input-boolean label="Off" [appearance]="appearance" />
                    <ui-input-boolean label="On" [appearance]="appearance" [value]="true" />
                    <ui-input-boolean label="Partly, like a group of which only some are on" indeterminate [appearance]="appearance" />
                    <ui-input-boolean label="Read only" readonly [appearance]="appearance" [value]="true" />
                    <ui-input-boolean label="Disabled" disabled [appearance]="appearance" />
                    <ui-input-boolean label="Disabled and on" disabled [appearance]="appearance" [value]="true" />
                }
            </div>
        `
    })
};

// checked, partly checked and on, in each color.
export const Colors: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-xl grid-cols-4 gap-2">
                @for (color of ['neutral', 'primary', 'secondary', 'success']; track color) {
                    <div class="grid gap-2">
                        <ui-input-boolean [label]="color" [color]="color" [value]="true" />
                        <ui-input-boolean [label]="color" indeterminate [color]="color" />
                        <ui-input-boolean [label]="color" appearance="switch" [color]="color" [value]="true" />
                    </div>
                }
            </div>
        `
    })
};

// a required checkbox has to be checked, like accepting the terms. The error shows right away instead of once the user
// left it.
export const Validation: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-boolean label="I accept the terms" required [showValidationError]="true" />
                <ui-input-boolean label="Keep me logged in" appearance="switch" required [showValidationError]="true" />
            </div>
        `
    })
};

// without a label, the content is the label, which can hold links, like a consent to the privacy policy. Following the
// link doesn't check it.
export const LabelWithLinks: Story = {
    decorators: [moduleMetadata({ imports: [LinkComponent] })],
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-boolean required>
                    I accept the <a ui-link href="#privacy">privacy policy</a> and the <a ui-link href="#terms">terms of service</a>.
                </ui-input-boolean>
                <ui-input-boolean required [showValidationError]="true">
                    I agree that my data is stored as described in the <a ui-link href="#privacy">privacy policy</a>.
                </ui-input-boolean>
            </div>
        `
    })
};

// the label is as high as an input of the same size, so both line up in a row.
export const Sizes: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80">
                @for (size of ['sm', 'md', 'lg']; track size) {
                    <ui-input-boolean label="Remember me" [size]="size" />
                    <ui-input-boolean label="Notifications" appearance="switch" [size]="size" />
                }
            </div>
        `
    })
};
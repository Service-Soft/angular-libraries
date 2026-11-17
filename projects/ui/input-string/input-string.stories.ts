import { ButtonComponent } from '@service-soft/ui/button';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { InputStringComponent } from './input-string.component';

const meta: Meta<InputStringComponent> = {
    title: 'UI/Input string',
    component: InputStringComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent] })],
    argTypes: {
        type: { control: 'inline-radio', options: ['text', 'email', 'password', 'search', 'tel', 'url'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        type: 'text',
        size: 'md',
        required: true,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, value: 'Jane Doe' },
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-string
                    label="Name"
                    hint="As in your passport"
                    [type]="type"
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

type Story = StoryObj<InputStringComponent>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-string label="Empty" placeholder="Placeholder" [required]="false" />
                <ui-input-string label="Filled" value="Filled" />
                <ui-input-string label="Read only" value="Read only" readonly />
                <ui-input-string label="Disabled" value="Disabled" disabled />
            </div>
        `
    })
};

// the native validation of the browser, with the errors shown right away instead of once the user left a field.
export const Validation: Story = {
    render: () => ({
        props: {
            validateUsername: (value: string) => value === 'admin' ? 'This username is taken.' : undefined
        },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-string label="Email" type="email" autocomplete="email" value="no email" [showValidationError]="true" />
                <ui-input-string label="Postcode" hint="5 digits" pattern="\\d{5}" value="1234" [showValidationError]="true" />
                <ui-input-string
                    label="Password"
                    type="password"
                    autocomplete="new-password"
                    [minLength]="10"
                    [showValidationError]="true"
                />
                <ui-input-string
                    label="Username"
                    value="admin"
                    [customValidation]="validateUsername"
                    [showValidationError]="true"
                />
            </div>
        `
    })
};

// a password has a button that shows it as text, in every size. The code asks phones for a number pad.
export const PasswordAndCode: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-4">
                @for (size of ['sm', 'md', 'lg']; track size) {
                    <ui-input-string label="Password" type="password" autocomplete="current-password" value="correct horse" [size]="size" />
                }
                <ui-input-string label="Password" type="password" value="correct horse" disabled />
                <ui-input-string label="Code" inputMode="numeric" autocomplete="one-time-code" pattern="\\d{6}" [maxLength]="6" />
            </div>
        `
    })
};

// a new password shows how hard it is to guess, in every strength.
export const PasswordStrength: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-string label="New password" type="password" autocomplete="new-password" passwordStrength />
                <ui-input-string label="New password" type="password" autocomplete="new-password" value="secret" passwordStrength />
                <ui-input-string label="New password" type="password" autocomplete="new-password" value="Secret-123" passwordStrength />
                <ui-input-string label="New password" type="password" value="Correct-horse-battery-1" passwordStrength />
            </div>
        `
    })
};

// a search has an icon at its start and a button that empties it while it has a text, in every size.
export const Search: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-string label="Search" type="search" placeholder="Search the news" [required]="false" />
                @for (size of ['sm', 'md', 'lg']; track size) {
                    <ui-input-string label="Search" type="search" value="Swimming" [required]="false" [size]="size" />
                }
                <ui-input-string label="Search" type="search" value="Read only" [required]="false" readonly />
                <ui-input-string label="Search" type="search" value="Disabled" [required]="false" disabled />
            </div>
        `
    })
};

// inputs and buttons of the same size line up in a row.
export const NextToAButton: Story = {
    render: () => ({
        template: `
            <div class="grid gap-4">
                @for (size of ['sm', 'md', 'lg']; track size) {
                    <div class="flex max-w-96 items-end gap-2">
                        <ui-input-string class="grow" label="Search" type="search" [required]="false" [size]="size" />
                        <button ui-button type="button" [size]="size">Search</button>
                    </div>
                }
            </div>
        `
    })
};
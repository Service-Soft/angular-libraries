import { InputOption } from '@service-soft/ui/input';
import { Meta, StoryObj } from '@storybook/angular';

import { InputChipsComponent } from './input-chips.component';

const TAGS: InputOption<string>[] = [
    { label: 'Angular', value: 'angular' },
    { label: 'Accessibility', value: 'a11y' },
    { label: 'Design', value: 'design' },
    { label: 'Performance', value: 'performance' },
    { label: 'Testing', value: 'testing' },
    { label: 'Legacy', value: 'legacy', disabled: true }
];

const meta: Meta<InputChipsComponent<string>> = {
    title: 'UI/Input chips',
    component: InputChipsComponent,
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary', 'success'] },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        size: 'md',
        color: 'primary',
        required: true,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, options: TAGS, value: ['angular', 'testing'], toTag: (text: string) => text.toLowerCase() },
        template: `
            <div class="grid max-w-96 gap-2">
                <ui-input-chips
                    label="Tags"
                    hint="Choose some, or type a new one and press Enter"
                    placeholder="Add a tag"
                    [options]="options"
                    [customValue]="toTag"
                    [size]="size"
                    [color]="color"
                    [required]="required"
                    [disabled]="disabled"
                    [readonly]="readonly"
                    [(value)]="value"
                />
                <p class="text-body-sm text-on-surface-variant">Value: {{ value.join(', ') }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputChipsComponent<string>>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        props: { options: TAGS, chosen: ['angular', 'a11y', 'performance'] },
        template: `
            <div class="grid max-w-96 gap-4">
                <ui-input-chips label="Empty" placeholder="Add a tag" [required]="false" [options]="options" />
                <ui-input-chips label="Chosen" [options]="options" [value]="chosen" />
                <ui-input-chips label="Read only" readonly [options]="options" [value]="chosen" />
                <ui-input-chips label="Disabled" disabled [options]="options" [value]="chosen" />
            </div>
        `
    })
};

// the checks of the input, with the errors shown right away instead of once the user left it.
// the chips in each color.
export const Colors: Story = {
    render: () => ({
        props: { options: TAGS, chosen: ['angular', 'a11y', 'performance'] },
        template: `
            <div class="grid max-w-96 gap-4">
                <ui-input-chips label="Neutral" color="neutral" [options]="options" [value]="chosen" />
                <ui-input-chips label="Primary" color="primary" [options]="options" [value]="chosen" />
                <ui-input-chips label="Secondary" color="secondary" [options]="options" [value]="chosen" />
                <ui-input-chips label="Success" color="success" [options]="options" [value]="chosen" />
            </div>
        `
    })
};

export const Validation: Story = {
    render: () => ({
        props: {
            options: TAGS,
            chosen: ['angular', 'design', 'testing'],
            validateAtMostTwo: (values: string[]) => values.length > 2 ? 'Choose at most two tags.' : undefined
        },
        template: `
            <div class="grid max-w-96 gap-4">
                <ui-input-chips label="Tags" [options]="options" [showValidationError]="true" />
                <ui-input-chips
                    label="Main topics"
                    [options]="options"
                    [value]="chosen"
                    [customValidation]="validateAtMostTwo"
                    [showValidationError]="true"
                />
            </div>
        `
    })
};
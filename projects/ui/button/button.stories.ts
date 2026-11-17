import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { provideButtonConfig } from './button-config.provider';
import { ButtonComponent } from './button.component';

const RADIO: 'inline-radio' = 'inline-radio';

const meta: Meta<ButtonComponent> = {
    title: 'UI/Button',
    component: ButtonComponent,
    argTypes: {
        variant: { control: RADIO, options: ['filled', 'outlined', 'text'] },
        color: { control: RADIO, options: ['primary', 'secondary', 'error', 'success'] },
        size: { control: RADIO, options: ['sm', 'md', 'lg'] },
        elevation: { control: RADIO, options: [0, 1, 2, 3, 4, 5] },
        disabled: { control: 'boolean' }
    },
    args: {
        variant: 'filled',
        color: 'primary',
        size: 'md',
        elevation: 0,
        disabled: false
    },
    render: args => ({
        props: args,
        template: `
            <button
                ui-button
                type="button"
                [variant]="variant"
                [color]="color"
                [size]="size"
                [elevation]="elevation"
                [disabled]="disabled"
            >
                Button
            </button>
        `
    })
};
export default meta;

type Story = StoryObj<ButtonComponent>;

export const Playground: Story = {};

export const Variants: Story = {
    render: () => ({
        template: `
            <div class="grid grid-cols-4 justify-items-start gap-4">
                @for (variant of ['filled', 'outlined', 'text']; track variant) {
                    @for (color of ['primary', 'secondary', 'error', 'success']; track color) {
                        <button ui-button type="button" [variant]="variant" [color]="color">{{ variant }} {{ color }}</button>
                    }
                }
            </div>
        `
    })
};

export const Elevation: Story = {
    render: () => ({
        template: `
            <div class="grid grid-cols-3 justify-items-start gap-6 bg-surface-container p-6">
                @for (elevation of [1, 2, 3, 4, 5]; track elevation) {
                    @for (variant of ['filled', 'outlined', 'text']; track variant) {
                        <button ui-button type="button" [variant]="variant" [elevation]="elevation">
                            {{ variant }} {{ elevation }}
                        </button>
                    }
                }
            </div>
        `
    })
};

// any svg works, inline or inside an icon component, as long as it draws with currentColor.
const ICON: string = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 5h2v14h-2zM5 11h14v2H5z" /></svg>';

export const Icons: Story = {
    render: () => ({
        template: `
            <div class="grid grid-cols-4 items-center justify-items-start gap-4">
                @for (size of ['sm', 'md', 'lg']; track size) {
                    <button ui-button type="button" [size]="size">${ICON} Add</button>
                    <button ui-button type="button" [size]="size">Next ${ICON}</button>
                    <button ui-button type="button" [size]="size" iconOnly aria-label="Add">${ICON}</button>
                    <button ui-button type="button" [size]="size" variant="outlined" iconOnly aria-label="Add">${ICON}</button>
                }
            </div>
        `
    })
};

// toggle buttons, pressed and not, of every variant and color.
export const Toggle: Story = {
    render: () => ({
        template: `
            <div class="grid grid-cols-4 justify-items-start gap-4">
                @for (variant of ['outlined', 'text']; track variant) {
                    @for (color of ['primary', 'secondary', 'error', 'success']; track color) {
                        <div class="flex gap-2">
                            <button ui-button type="button" [variant]="variant" [color]="color" [pressed]="true">Pressed</button>
                            <button ui-button type="button" [variant]="variant" [color]="color" [pressed]="false">Not pressed</button>
                        </div>
                    }
                }
            </div>
        `
    })
};

export const Disabled: Story = {
    render: () => ({
        template: `
            <div class="flex gap-4">
                @for (variant of ['filled', 'outlined', 'text']; track variant) {
                    <button ui-button type="button" [variant]="variant" disabled>{{ variant }} disabled</button>
                }
            </div>
        `
    })
};

export const LongLabel: Story = {
    render: () => ({
        template: `
            <div class="w-48">
                <button ui-button type="button">A label that is too long for a single line wraps</button>            </div>
        `
    })
};

export const Link: Story = {
    render: () => ({
        template: `
            <div class="flex gap-4">
                <a ui-button href="https://angular.dev">Link</a>
                <a ui-button href="https://angular.dev" disabled>Disabled link</a>
            </div>
        `
    })
};

// shows how provideButtonConfig changes the defaults, so on purpose not the default filled button.
export const ConfiguredDefaults: Story = {
    decorators: [applicationConfig({ providers: [provideButtonConfig({ variant: 'outlined', size: 'sm' })] })],
    render: () => ({
        template: '<button ui-button type="button">No inputs, outlined and small from provideButtonConfig</button>'
    })
};
import { ButtonComponent } from '@service-soft/ui/button';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { SpinnerComponent } from './spinner.component';

const meta: Meta<SpinnerComponent> = {
    title: 'UI/Spinner',
    component: SpinnerComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent] })],
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }
    },
    args: {
        label: 'Loading',
        size: 'md'
    }
};
export default meta;

type Story = StoryObj<SpinnerComponent>;

export const Playground: Story = {};

export const Sizes: Story = {
    render: () => ({
        template: `
            <div class="flex items-center gap-6 text-body text-on-surface">
                <p><ui-spinner size="sm" label="Loading orders" /> Loading orders</p>
                <ui-spinner size="md" />
                <ui-spinner size="lg" />
            </div>
        `
    })
};

// a button sizes the spinner like its icons. The button says what happens, the spinner that it isn't done yet.
export const InButton: Story = {
    render: () => ({
        template: `
            <button ui-button type="button" disabled>
                <ui-spinner label="Saving" />
                Saving
            </button>
        `
    })
};

// on a colored surface, the arc takes the on- color of it.
export const OnColoredSurface: Story = {
    render: () => ({
        template: `
            <div class="flex gap-4">
                <div class="surface-primary rounded-details p-6"><ui-spinner size="lg" /></div>
                <div class="surface-secondary rounded-details p-6"><ui-spinner size="lg" /></div>
            </div>
        `
    })
};
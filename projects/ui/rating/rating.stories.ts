import { Meta, StoryObj } from '@storybook/angular';

import { RatingComponent } from './rating.component';

const meta: Meta<RatingComponent> = {
    title: 'UI/Rating',
    component: RatingComponent,
    argTypes: {
        value: { control: { type: 'range', min: 0, max: 5, step: 0.1 } },
        max: { control: 'number' }
    },
    args: {
        value: 4.4,
        max: 5
    }
};
export default meta;

type Story = StoryObj<RatingComponent>;

export const Playground: Story = {};

// a part of a star fills as well, like the 0.4 of 4.4.
export const Values: Story = {
    render: () => ({
        template: `
            <div class="flex flex-col gap-2 text-on-surface">
                <ui-rating [value]="0" />
                <ui-rating [value]="2.5" />
                <ui-rating [value]="4.4" />
                <ui-rating [value]="5" />
            </div>
        `
    })
};

// as large as the text around it.
export const Sizes: Story = {
    render: () => ({
        template: `
            <div class="flex flex-col gap-2 text-on-surface">
                <span class="text-body-sm"><ui-rating [value]="4.4" /></span>
                <span class="text-body"><ui-rating [value]="4.4" /></span>
                <span class="text-display"><ui-rating [value]="4.4" /></span>
            </div>
        `
    })
};

export const TenStars: Story = {
    args: { value: 7.5, max: 10 }
};

// on surface-container, the other surface its stars keep their contrast on.
export const OnContainer: Story = {
    render: () => ({
        template: '<div class="bg-surface-container p-4"><ui-rating [value]="3.7" /></div>'
    })
};
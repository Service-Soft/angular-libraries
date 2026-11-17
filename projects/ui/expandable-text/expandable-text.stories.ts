import { Meta, StoryObj } from '@storybook/angular';

import { ExpandableTextComponent } from './expandable-text.component';

const TEXT: string = `
    <p>
        We moved more than 400 pages of the old site of the club, and every department got pages it edits itself: the
        news, the training times, the coaches and the events, with pictures and documents.
    </p>
    <p>
        The site is rendered on the server, so it loads fast and search engines read all of it, and members sign up for
        courses online instead of on paper at the office.
    </p>
`;

const meta: Meta<ExpandableTextComponent> = {
    title: 'UI/Expandable text',
    component: ExpandableTextComponent,
    argTypes: {
        lines: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] }
    },
    args: {
        lines: 3
    },
    render: args => ({
        props: args,
        template: `<ui-expandable-text class="max-w-md text-body text-on-surface" [lines]="lines">${TEXT}</ui-expandable-text>`
    })
};
export default meta;

type Story = StoryObj<ExpandableTextComponent>;

export const Playground: Story = {};

// open, with the button that shows less.
export const Expanded: Story = {
    render: () => ({
        template: `<ui-expandable-text class="max-w-md text-body text-on-surface" [expanded]="true">${TEXT}</ui-expandable-text>`
    })
};

// a text that fits its lines has no button and doesn't fade.
export const Short: Story = {
    render: () => ({
        template: `
            <ui-expandable-text class="max-w-md text-body text-on-surface"><p>Training is on Mondays at 6 pm.</p></ui-expandable-text>
        `
    })
};

// the fade is a mask, so it works on every background, like a filled card or a colored surface.
export const OnColor: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-md gap-4">
                <div class="rounded-card bg-surface-container p-4">
                    <ui-expandable-text class="text-body text-on-surface" [lines]="2">${TEXT}</ui-expandable-text>
                </div>
                <div class="surface-primary rounded-card p-4">
                    <ui-expandable-text class="text-body" [lines]="2">${TEXT}</ui-expandable-text>
                </div>
            </div>
        `
    })
};
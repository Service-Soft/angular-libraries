import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { StepComponent } from './step.component';
import { StepsComponent } from './steps.component';

const STEPS: string = `
    <ui-step heading="Sign up"><p>Fill in the form online, or come to the office on Tuesdays from 5 to 7 pm.</p></ui-step>
    <ui-step heading="Try it"><p>Train with any group for free for two weeks.</p></ui-step>
    <ui-step heading="Join"><p>Pick your department and pay the first fee.</p></ui-step>
    <ui-step heading="Get your card"><p>It opens the gym and gets you into every event.</p></ui-step>
`;

const meta: Meta<StepsComponent> = {
    title: 'UI/Steps',
    component: StepsComponent,
    decorators: [moduleMetadata({ imports: [StepComponent] })],
    argTypes: {
        orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] }
    },
    args: {
        orientation: 'vertical'
    },
    render: args => ({
        props: args,
        template: `<ui-steps class="max-w-5xl" [orientation]="orientation">${STEPS}</ui-steps>`
    })
};
export default meta;

type Story = StoryObj<StepsComponent>;

export const Playground: Story = {};

export const Vertical: Story = {
    render: () => ({
        template: `<ui-steps class="max-w-xl">${STEPS}</ui-steps>`
    })
};

export const Horizontal: Story = {
    render: () => ({
        template: `<ui-steps class="max-w-5xl" orientation="horizontal">${STEPS}</ui-steps>`
    })
};

// horizontal steps in a list narrower than 48rem, like on a phone, stand below each other.
export const HorizontalNarrow: Story = {
    render: () => ({
        template: `<ui-steps class="max-w-sm" orientation="horizontal">${STEPS}</ui-steps>`
    })
};

// on a colored surface, the numbers take its on- color.
export const OnColoredSurface: Story = {
    render: () => ({
        template: `
            <div class="surface-secondary max-w-5xl p-6">
                <ui-steps orientation="horizontal">${STEPS}</ui-steps>
            </div>
        `
    })
};
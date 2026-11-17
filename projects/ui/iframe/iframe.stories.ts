import { Meta, StoryObj } from '@storybook/angular';

import { IframeComponent } from './iframe.component';

const meta: Meta<IframeComponent> = {
    title: 'UI/Iframe',
    component: IframeComponent,
    render: args => ({
        props: args,
        template: '<ui-iframe class="max-w-2xl" src="embed-example.html" [label]="label" [aspectRatio]="aspectRatio" />'
    }),
    argTypes: {
        aspectRatio: { control: 'inline-radio', options: ['16 / 9', '4 / 3', '1 / 1'] }
    },
    args: {
        label: 'An embedded page',
        aspectRatio: '16 / 9'
    }
};
export default meta;

type Story = StoryObj<IframeComponent>;

export const Playground: Story = {};

// without a ratio it fills a box of the app, like one that is as high as the content next to it.
export const FillingItsParent: Story = {
    render: () => ({
        props: { aspectRatio: undefined },
        template: `
            <div class="h-64 max-w-2xl">
                <ui-iframe class="h-full" src="embed-example.html" label="An embedded page" [aspectRatio]="aspectRatio" />
            </div>
        `
    })
};
import { LinkComponent } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { HeadingComponent } from './heading.component';

const meta: Meta<HeadingComponent> = {
    title: 'UI/Heading',
    component: HeadingComponent,
    decorators: [moduleMetadata({ imports: [LinkComponent] })],
    argTypes: {
        level: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] }
    },
    args: {
        level: 2
    },
    render: args => ({
        props: args,
        template: '<ui-heading class="font-heading text-headline" [level]="level">Prices</ui-heading>'
    })
};
export default meta;

type Story = StoryObj<HeadingComponent>;

export const Playground: Story = {};

// every level, each styled by its element: the heading itself takes the look of what it is in.
export const Levels: Story = {
    render: () => ({
        template: `
            <div class="grid gap-2">
                <ui-heading class="font-heading text-display" [level]="1">Level 1</ui-heading>
                <ui-heading class="font-heading text-headline" [level]="2">Level 2</ui-heading>
                <ui-heading class="font-heading text-title" [level]="3">Level 3</ui-heading>
                <ui-heading class="font-heading text-title" [level]="4">Level 4</ui-heading>
                <ui-heading class="font-heading text-label-lg" [level]="5">Level 5</ui-heading>
                <ui-heading class="font-heading text-label" [level]="6">Level 6</ui-heading>
            </div>
        `
    })
};

// the content is your own, like the link of the title of an article.
export const WithLink: Story = {
    render: () => ({
        template: `
            <ui-heading class="font-heading text-title" [level]="2">
                <a ui-link appearance="subtle" href="https://example.com/news/summer-party">Summer party on July 12</a>
            </ui-heading>
        `
    })
};
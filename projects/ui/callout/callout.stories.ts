import { faBell } from '@fortawesome/free-solid-svg-icons';
import { LinkComponent } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { CalloutTone } from './callout-tone.type';
import { CalloutComponent } from './callout.component';

const TONES: CalloutTone[] = ['neutral', 'info', 'success', 'warning', 'error', 'promo'];

const meta: Meta<CalloutComponent> = {
    title: 'UI/Callout',
    component: CalloutComponent,
    decorators: [moduleMetadata({ imports: [LinkComponent] })],
    argTypes: {
        tone: { control: 'inline-radio', options: TONES }
    },
    args: {
        tone: 'info',
        heading: 'Training in the summer holidays'
    },
    render: args => ({
        props: args,
        template: `
            <ui-callout class="max-w-xl" [tone]="tone" [heading]="heading">
                <p>All groups train as usual, only the pool is closed from July 20 to August 3.</p>
            </ui-callout>
        `
    })
};
export default meta;

type Story = StoryObj<CalloutComponent>;

export const Playground: Story = {};

// every tone, with a link inside, whose contrast to the tint of each tone is checked.
export const Tones: Story = {
    render: () => ({
        props: { tones: TONES },
        template: `
            <div class="grid max-w-xl gap-4">
                @for (tone of tones; track tone) {
                    <ui-callout [tone]="tone" [heading]="tone">
                        <p>A note in the tone {{ tone }}, with <a ui-link href="https://example.com/details">a link to the details</a>.</p>
                    </ui-callout>
                }
            </div>
        `
    })
};

// on the container, like in a section that is set apart, the tints still stand out.
export const OnContainer: Story = {
    render: () => ({
        props: { tones: TONES },
        template: `
            <div class="grid max-w-xl gap-4 bg-surface-container p-6">
                @for (tone of tones; track tone) {
                    <ui-callout [tone]="tone"><p>Only content, without a heading, in the tone {{ tone }}.</p></ui-callout>
                }
            </div>
        `
    })
};

// neutral, info and promo follow a colored surface; status tones keep their colors, so they belong on the surface.
export const OnColoredSurface: Story = {
    render: () => ({
        props: { tones: ['neutral', 'info', 'promo'] },
        template: `
            <div class="grid max-w-xl gap-4">
                <div class="surface-primary p-6">
                    <div class="grid gap-4">
                        @for (tone of tones; track tone) {
                            <ui-callout [tone]="tone" [heading]="tone"><p>With <a ui-link href="https://example.com/a">a link</a>.</p></ui-callout>
                        }
                    </div>
                </div>
                <div class="surface-secondary p-6">
                    <div class="grid gap-4">
                        @for (tone of tones; track tone) {
                            <ui-callout [tone]="tone" [heading]="tone"><p>With <a ui-link href="https://example.com/b">a link</a>.</p></ui-callout>
                        }
                    </div>
                </div>
            </div>
        `
    })
};

// an icon of its own replaces the one of the tone, a longer content keeps the icon next to its first line.
export const CustomIconAndLongContent: Story = {
    render: () => ({
        props: { bell: faBell },
        template: `
            <ui-callout class="max-w-md" tone="promo" heading="Open day on Saturday, September 12, from 10 am to 4 pm" [icon]="bell">
                <p>Try every sport for free, meet the coaches and have a look at the new hall.</p>
                <p>Children under 12 come with an adult.</p>
            </ui-callout>
        `
    })
};
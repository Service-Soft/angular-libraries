import { ButtonComponent } from '@service-soft/ui/button';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { MediaSplitMediaComponent } from './media-split-media.component';
import { MediaSplitComponent } from './media-split.component';

// pictures without a request, like ones the backend serves, in the aspect ratios of photos.
function createPicture(sky: string, ground: string): string {
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${sky}"/>`
        + '<circle cx="620" cy="150" r="70" fill="#f9d77e"/>'
        + `<path d="M0 420 220 260 420 400 560 300 800 460V600H0z" fill="${ground}"/></svg>`
    )}`;
}

const HALL: string = createPicture('#9cc6e8', '#3d5a7a');
const POOL: string = createPicture('#b8e0d2', '#2f6f62');
const FIELD: string = createPicture('#f3d9b1', '#7a5a3d');

const RADIO: 'inline-radio' = 'inline-radio';

const meta: Meta<MediaSplitComponent> = {
    title: 'UI/Media split',
    component: MediaSplitComponent,
    decorators: [moduleMetadata({ imports: [MediaSplitMediaComponent, ButtonComponent] })],
    argTypes: {
        position: { control: RADIO, options: ['start', 'end'] },
        mediaWidth: { control: RADIO, options: ['narrow', 'half', 'wide'] },
        align: { control: RADIO, options: ['start', 'center'] }
    },
    args: {
        position: 'start',
        mediaWidth: 'half',
        align: 'center'
    },
    render: args => ({
        props: { ...args, picture: HALL },
        template: `
            <ui-media-split class="max-w-5xl" [position]="position" [mediaWidth]="mediaWidth" [align]="align">
                <ui-media-split-media><img alt="The new hall from the outside" [src]="picture" /></ui-media-split-media>
                <h2 class="font-heading text-headline">Our new hall</h2>
                <p class="text-body">Built in 2024, with room for six teams at once, a climbing wall and a café for the parents.</p>
                <a ui-button href="https://example.com/hall">Book the hall</a>
            </ui-media-split>
        `
    })
};
export default meta;

type Story = StoryObj<MediaSplitComponent>;

export const Playground: Story = {};

// splits below each other, the media switching sides, zig-zag down the page.
export const ZigZag: Story = {
    render: () => ({
        props: { hall: HALL, pool: POOL, field: FIELD },
        template: `
            <div class="grid max-w-5xl gap-16">
                <ui-media-split>
                    <ui-media-split-media><img alt="The hall" [src]="hall" /></ui-media-split-media>
                    <h2 class="font-heading text-title">Gymnastics</h2>
                    <p class="text-body">Every weekday from 4 pm, for children from three years on.</p>
                </ui-media-split>
                <ui-media-split position="end">
                    <ui-media-split-media><img alt="The pool" [src]="pool" /></ui-media-split-media>
                    <h2 class="font-heading text-title">Swimming</h2>
                    <p class="text-body">Courses for beginners and training for the competition team.</p>
                </ui-media-split>
                <ui-media-split>
                    <ui-media-split-media><img alt="The football field" [src]="field" /></ui-media-split-media>
                    <h2 class="font-heading text-title">Football</h2>
                    <p class="text-body">Eleven teams, from the youngest to the seniors.</p>
                </ui-media-split>
            </div>
        `
    })
};

// the widths of the media, at the start and at the end, lined up at their tops.
export const Widths: Story = {
    render: () => ({
        props: { picture: POOL, widths: ['narrow', 'half', 'wide'] },
        template: `
            <div class="grid max-w-5xl gap-12">
                @for (width of widths; track width) {
                    @for (position of ['start', 'end']; track position) {
                        <ui-media-split align="start" [mediaWidth]="width" [position]="position">
                            <ui-media-split-media><img alt="" [src]="picture" /></ui-media-split-media>
                            <h2 class="font-heading text-title">{{ width }} at the {{ position }}</h2>
                            <p class="text-body">The text takes the rest of the width.</p>
                        </ui-media-split>
                    }
                }
            </div>
        `
    })
};

// narrower than 48rem, like in a narrow column or on a phone, the media stands above the text, wherever its position.
export const Stacked: Story = {
    render: () => ({
        props: { picture: FIELD },
        template: `
            <ui-media-split class="max-w-sm" position="end">
                <ui-media-split-media><img alt="The football field" [src]="picture" /></ui-media-split-media>
                <h2 class="font-heading text-title">Football</h2>
                <p class="text-body">Eleven teams, from the youngest to the seniors.</p>
            </ui-media-split>
        `
    })
};
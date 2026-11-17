import { afterNextRender, Component, ElementRef, inject, input, InputSignal } from '@angular/core';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { GalleryImage } from './gallery-image.model';
import { GalleryComponent } from './gallery.component';

// opens a picture as the story renders, like a user who clicked its thumbnail.
@Component({
    selector: 'ui-opened-gallery',
    template: '<ui-gallery [images]="images()" />',
    imports: [GalleryComponent]
})
class OpenedGalleryComponent {
    readonly images: InputSignal<GalleryImage[]> = input.required<GalleryImage[]>();

    readonly index: InputSignal<number> = input(0);

    constructor() {
        const element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        afterNextRender(() => element.querySelectorAll<HTMLButtonElement>('li button')[this.index()]?.click());
    }
}

// NgOptimizedImage refuses data urls, so the pictures are files of the storybook. One of them is upright, which the
// dialog shows whole.
const IMAGES: GalleryImage[] = [
    { src: '/photo-1.svg', alt: 'Green hills under a summer sun', caption: 'The hills behind the club grounds.' },
    { src: '/photo-2.svg', alt: 'Waves at sunset' },
    { src: '/photo-3.svg', alt: 'Mountains at night', caption: 'The night run, photo by Ada Lovelace.' },
    { src: '/photo-4.svg', alt: 'The club house with its red roof' },
    { src: '/photo-5.svg', alt: 'A football pitch with its goal' },
    { src: '/photo-6.svg', alt: 'A pink tree in bloom' }
];

const meta: Meta<GalleryComponent> = {
    title: 'UI/Gallery',
    component: GalleryComponent,
    decorators: [moduleMetadata({ imports: [OpenedGalleryComponent] })],
    args: {
        images: IMAGES
    },
    render: args => ({
        props: args,
        template: '<ui-gallery class="max-w-4xl" [images]="images" />'
    })
};
export default meta;

type Story = StoryObj<GalleryComponent>;

export const Playground: Story = {};

// a picture open over the whole screen, with its caption, its position and the buttons to the others.
export const Open: Story = {
    render: () => ({
        props: { images: IMAGES },
        template: '<ui-opened-gallery [images]="images" />'
    })
};

// an upright picture shows whole, with space on its sides.
export const OpenUpright: Story = {
    render: () => ({
        props: { images: IMAGES },
        template: '<ui-opened-gallery [images]="images" [index]="5" />'
    })
};

// in a narrow column, two thumbnails make a row.
export const Narrow: Story = {
    render: () => ({
        props: { images: IMAGES },
        template: '<ui-gallery class="max-w-xs" [images]="images" />'
    })
};

// a single picture has no buttons to the one before and after.
export const SinglePicture: Story = {
    render: () => ({
        props: { images: IMAGES.slice(0, 1) },
        template: '<ui-gallery class="max-w-xs" [images]="images" />'
    })
};
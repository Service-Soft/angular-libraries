import { Meta, StoryObj } from '@storybook/angular';

import { TestimonialComponent } from './testimonial.component';

// a picture without a request, like one the backend serves
const PORTRAIT: string = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#9cc6e8"/>'
    + '<circle cx="24" cy="19" r="9" fill="#3d5a7a"/><path d="M8 48c0-10 7-16 16-16s16 6 16 16z" fill="#3d5a7a"/></svg>'
)}`;

const meta: Meta<TestimonialComponent> = {
    title: 'UI/Testimonial',
    component: TestimonialComponent,
    render: args => ({
        props: args,
        template: `
            <ui-testimonial class="max-w-md" [name]="name" [subtitle]="subtitle" [rating]="rating" [variant]="variant">
                <p>A great club with great coaches. My kids have been training here for three years and love every minute.</p>
            </ui-testimonial>
        `
    }),
    argTypes: {
        rating: { control: { type: 'range', min: 0, max: 5, step: 0.5 } },
        variant: { control: 'inline-radio', options: ['card', 'quote'] }
    },
    args: {
        name: 'Ada Lovelace',
        subtitle: 'Member since 2019',
        rating: 5,
        variant: 'card'
    }
};
export default meta;

type Story = StoryObj<TestimonialComponent>;

export const Playground: Story = {};

// without a rating there are no stars, without a subtitle only the name.
export const WithoutRatingAndSubtitle: Story = {
    render: () => ({
        template: `
            <ui-testimonial class="max-w-md" name="Grace Hopper">
                <p>The best place to start with a new sport, whatever your age.</p>
            </ui-testimonial>
        `
    })
};

export const WithPicture: Story = {
    render: () => ({
        props: { portrait: PORTRAIT },
        template: `
            <ui-testimonial class="max-w-md" name="Alan Turing" subtitle="Swimming department" [avatar]="portrait" [rating]="4.5">
                <p>Friendly people, good training times and a pool that is never too crowded.</p>
            </ui-testimonial>
        `
    })
};

// next to each other in a grid, every testimonial is as high as the highest of its row.
export const Grid: Story = {
    render: () => ({
        props: { portrait: PORTRAIT },
        template: `
            <div class="grid gap-4 md:grid-cols-3">
                <ui-testimonial name="Ada Lovelace" subtitle="Member since 2019" [rating]="5">
                    <p>A great club with great coaches. My kids have been training here for three years and love every minute.</p>
                </ui-testimonial>
                <ui-testimonial name="Grace Hopper" subtitle="Gymnastics" [rating]="4">
                    <p>The best place to start with a new sport.</p>
                </ui-testimonial>
                <ui-testimonial name="Alan Turing" subtitle="Swimming department" [avatar]="portrait" [rating]="4.5">
                    <p>Friendly people, good training times and a pool that is never too crowded.</p>
                    <p>The summer party alone is worth the membership.</p>
                </ui-testimonial>
            </div>
        `
    })
};

// a large quote with the portrait of the person beside it, like the one a page about a practice is built around.
export const Quote: Story = {
    render: () => ({
        props: { portrait: PORTRAIT },
        template: `
            <ui-testimonial
                class="max-w-5xl"
                variant="quote"
                name="Dr. Ada Lovelace"
                subtitle="Dentist and owner of the practice"
                [avatar]="portrait"
            >
                <p>We take the time it takes. Every patient is different, and so is every treatment.</p>
            </ui-testimonial>
        `
    })
};

// without a picture, the quote takes the whole width, with the rating above it.
export const QuoteWithoutPortrait: Story = {
    render: () => ({
        template: `
            <ui-testimonial class="max-w-3xl" variant="quote" name="Grace Hopper" subtitle="Patient since 2015" [rating]="5">
                <p>The friendliest practice I know. Nobody here ever made me feel rushed.</p>
            </ui-testimonial>
        `
    })
};

// narrower than 48rem, like on a phone, the portrait stands above the quote.
export const QuoteNarrow: Story = {
    render: () => ({
        props: { portrait: PORTRAIT },
        template: `
            <ui-testimonial class="max-w-sm" variant="quote" name="Dr. Ada Lovelace" subtitle="Dentist" [avatar]="portrait">
                <p>We take the time it takes.</p>
            </ui-testimonial>
        `
    })
};
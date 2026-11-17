import { Meta, StoryObj } from '@storybook/angular';

import { RatingBadgeComponent } from './rating-badge.component';

// a logo without a request, like one of another review site
const OTHER_LOGO: string = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#00b67a"/>'
    + '<path d="M12 4l2.2 5.3 5.8.4-4.4 3.8 1.4 5.6L12 16l-5 3.1 1.4-5.6L4 9.7l5.8-.4z" fill="#ffffff"/></svg>'
)}`;

const meta: Meta<RatingBadgeComponent> = {
    title: 'UI/Rating badge',
    component: RatingBadgeComponent,
    render: args => ({
        props: args,
        template: '<a ui-rating-badge href="https://example.com/reviews" target="_blank" [value]="value" [max]="max"></a>'
    }),
    argTypes: {
        value: { control: { type: 'range', min: 0, max: 5, step: 0.1 } }
    },
    args: {
        value: 4.4,
        max: 5
    }
};
export default meta;

type Story = StoryObj<RatingBadgeComponent>;

// the logo of Google by default.
export const Default: Story = {};

export const OtherLogo: Story = {
    render: () => ({
        props: { logo: { src: OTHER_LOGO, alt: 'Example Reviews' } },
        template: '<a ui-rating-badge href="https://example.com/reviews" [value]="4.8" [logo]="logo"></a>'
    })
};

// raised on the surface, so it stands out on a colored header or a picture as well.
export const OnColor: Story = {
    render: () => ({
        template: `
            <div class="flex flex-col items-start gap-4 bg-primary p-8">
                <h1 class="font-heading text-display text-on-primary">SG Example</h1>
                <a ui-rating-badge href="https://example.com/reviews" target="_blank" [value]="4.4"></a>
            </div>
        `
    })
};
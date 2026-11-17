import { Meta, StoryObj } from '@storybook/angular';

import { AvatarComponent } from './avatar.component';

// a picture without a request, like one the backend serves
const PORTRAIT: string = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#9cc6e8"/>'
    + '<circle cx="24" cy="19" r="9" fill="#3d5a7a"/><path d="M8 48c0-10 7-16 16-16s16 6 16 16z" fill="#3d5a7a"/></svg>'
)}`;

const meta: Meta<AvatarComponent> = {
    title: 'UI/Avatar',
    component: AvatarComponent,
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary'] },
        decorative: { control: 'boolean' }
    },
    args: {
        name: 'Ada Lovelace',
        size: 'md',
        color: 'primary',
        decorative: false
    }
};
export default meta;

type Story = StoryObj<AvatarComponent>;

export const Playground: Story = {};

export const Sizes: Story = {
    render: () => ({
        template: `
            <div class="flex items-center gap-4">
                <ui-avatar name="Ada Lovelace" size="sm" />
                <ui-avatar name="Ada Lovelace" size="md" />
                <ui-avatar name="Ada Lovelace" size="lg" />
            </div>
        `
    })
};

export const Colors: Story = {
    render: () => ({
        template: `
            <div class="flex items-center gap-4">
                <ui-avatar name="Ada Lovelace" color="neutral" />
                <ui-avatar name="Grace Hopper" color="primary" />
                <ui-avatar name="Alan Turing" color="secondary" />
            </div>
        `
    })
};

export const Image: Story = {
    render: () => ({
        props: { portrait: PORTRAIT },
        template: `
            <div class="flex items-center gap-4">
                <ui-avatar name="Ada Lovelace" size="sm" [src]="portrait" />
                <ui-avatar name="Ada Lovelace" size="md" [src]="portrait" />
                <ui-avatar name="Ada Lovelace" size="lg" [src]="portrait" />
            </div>
        `
    })
};

// a picture that can't be loaded shows the initials instead of a broken image.
export const BrokenImage: Story = {
    render: () => ({
        props: { broken: 'data:image/png;base64,broken' },
        template: '<ui-avatar name="Ada Lovelace" size="lg" [src]="broken" />'
    })
};

// next to the name it shows, screen readers skip it, so they don't read the name twice.
export const DecorativeNextToName: Story = {
    render: () => ({
        props: { portrait: PORTRAIT },
        template: `
            <div class="flex items-center gap-3 text-body text-on-surface">
                <ui-avatar name="Ada Lovelace" decorative [src]="portrait" />
                <span>Ada Lovelace</span>
            </div>
        `
    })
};

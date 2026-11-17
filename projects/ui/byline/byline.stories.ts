import { faComment, faEye } from '@fortawesome/free-solid-svg-icons';
import { Meta, StoryObj } from '@storybook/angular';

import { BylineComponent } from './byline.component';

// a picture without a request, like one the backend serves
const PORTRAIT: string = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#9cc6e8"/>'
    + '<circle cx="24" cy="19" r="9" fill="#3d5a7a"/><path d="M8 48c0-10 7-16 16-16s16 6 16 16z" fill="#3d5a7a"/></svg>'
)}`;

const meta: Meta<BylineComponent> = {
    title: 'UI/Byline',
    component: BylineComponent,
    render: args => ({
        props: args,
        template: `
            <ui-byline
                [author]="author"
                [date]="date"
                [readingTime]="readingTime"
                [category]="category"
                [showAvatar]="showAvatar"
            />
        `
    }),
    args: {
        author: 'Ada Lovelace',
        date: '2026-11-15',
        readingTime: 5,
        category: 'Club news',
        showAvatar: false
    }
};
export default meta;

type Story = StoryObj<BylineComponent>;

export const Playground: Story = {};

// the avatar shows the picture, or the initials without one.
export const WithAvatar: Story = {
    render: () => ({
        props: { portrait: PORTRAIT },
        template: `
            <div class="grid gap-4">
                <ui-byline author="Ada Lovelace" date="2026-11-15" [readingTime]="5" showAvatar [avatar]="portrait" />
                <ui-byline author="Grace Hopper" date="2026-10-02" showAvatar />
            </div>
        `
    })
};

// entries of your own after the others, with an icon each.
export const Items: Story = {
    render: () => ({
        props: { items: [{ text: '12 comments', icon: faComment }, { text: '1,204 views', icon: faEye }] },
        template: '<ui-byline author="Ada Lovelace" date="2026-11-15" [items]="items" />'
    })
};

// only the date, like on a list of news without authors.
export const DateOnly: Story = {
    render: () => ({
        template: '<ui-byline date="2026-11-15" />'
    })
};

// too narrow for one line, so the entries wrap, each in one piece.
export const Narrow: Story = {
    render: () => ({
        template: `
            <div class="max-w-48">
                <ui-byline author="Ada Lovelace" date="2026-11-15" [readingTime]="12" category="Club news" showAvatar />
            </div>
        `
    })
};
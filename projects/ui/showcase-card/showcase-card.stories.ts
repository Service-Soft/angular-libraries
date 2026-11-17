import { ButtonComponent } from '@service-soft/ui/button';
import { LinkComponent } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { ShowcaseCardDetailsComponent } from './showcase-card-details.component';
import { ShowcaseCardComponent } from './showcase-card.component';

// NgOptimizedImage refuses data urls, so the images are files of the storybook.
const IMAGE: { src: string, alt: string } = { src: '/photo-4.svg', alt: 'The club house with its red roof' };
const LOGO: { src: string, alt: string, width: number, height: number } = { src: '/logo.svg', alt: 'SG Example', width: 40, height: 40 };

const meta: Meta<ShowcaseCardComponent> = {
    title: 'UI/Showcase card',
    component: ShowcaseCardComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent, LinkComponent, ShowcaseCardDetailsComponent] })],
    argTypes: {
        variant: { control: 'inline-radio', options: ['elevated', 'outlined', 'filled'] },
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary'] }
    },
    args: {
        title: 'A website for a sports club',
        start: '2022-02',
        end: 'open',
        summary: 'The club maintains its news, events and departments itself, and members sign up online.',
        tags: ['Angular', 'Tailwind', 'SEO'],
        variant: 'elevated',
        color: 'neutral'
    },
    render: args => ({
        props: { ...args, image: IMAGE, logos: [LOGO] },
        template: `
            <ui-showcase-card
                class="max-w-sm"
                [title]="title"
                [start]="start"
                [end]="end"
                [summary]="summary"
                [tags]="tags"
                [image]="image"
                [logos]="logos"
                [variant]="variant"
                [color]="color"
            >
                <ui-showcase-card-details>
                    <p>We moved more than 400 pages of the old site, and every department got pages it edits itself.</p>
                    <p>The server renders every page, so it loads fast and search engines read all of it.</p>
                </ui-showcase-card-details>
                <a ui-link href="#reference">Read more</a>
            </ui-showcase-card>
        `
    })
};
export default meta;

type Story = StoryObj<ShowcaseCardComponent>;

export const Playground: Story = {};

// references, an event and a product next to each other, with their links at the bottom of every card.
export const Grid: Story = {
    render: () => ({
        props: { image: IMAGE, logos: [LOGO] },
        template: `
            <div class="grid gap-4 md:grid-cols-3">
                <ui-showcase-card
                    title="A website for a sports club"
                    start="2022-02"
                    end="open"
                    summary="News, events and departments, maintained by the club itself."
                    [image]="image"
                    [tags]="['Angular', 'Tailwind']"
                    [logos]="logos"
                >
                    <a ui-link href="#club">Read more</a>
                </ui-showcase-card>
                <ui-showcase-card
                    title="Summer party"
                    start="2026-07-03"
                    [periodFormat]="{ dateStyle: 'long' }"
                    summary="Games, music and the best cake of the season."
                    [tags]="['Event', 'Family']"
                >
                    <a ui-button href="#tickets" size="sm">Tickets</a>
                    <a ui-link href="#program">Program</a>
                </ui-showcase-card>
                <ui-showcase-card title="Booking system" start="2019-05" end="2021-11" summary="Courts and rooms for 2,000 members.">
                    <ui-showcase-card-details>
                        <p>Members book online, the office sees every booking in one calendar.</p>
                    </ui-showcase-card-details>
                    <a ui-link href="#booking">Read more</a>
                </ui-showcase-card>
            </div>
        `
    })
};

// every variant in every color of the card.
export const Variants: Story = {
    render: () => ({
        props: { variants: ['elevated', 'outlined', 'filled'], colors: ['neutral', 'primary', 'secondary'] },
        template: `
            <div class="grid gap-4 md:grid-cols-3">
                @for (color of colors; track color) {
                    @for (variant of variants; track variant) {
                        <ui-showcase-card
                            [title]="variant + ' ' + color"
                            start="2022-02"
                            end="2024-03"
                            summary="A short text about it."
                            [tags]="['Tag']"
                            [variant]="variant"
                            [color]="color"
                        >
                            <a ui-link href="#more">Read more</a>
                        </ui-showcase-card>
                    }
                }
            </div>
        `
    })
};
import { BylineComponent } from '@service-soft/ui/byline';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { ArticleCardLinkDirective } from './article-card-link.directive';
import { ArticleCardComponent } from './article-card.component';

const RADIO: 'inline-radio' = 'inline-radio';

// NgOptimizedImage refuses data urls, so the images are files of the storybook.
const IMAGES: Record<string, { src: string, alt: string }> = {
    hills: { src: '/photo-1.svg', alt: 'Green hills under a summer sun' },
    sea: { src: '/photo-2.svg', alt: 'Waves at sunset' },
    night: { src: '/photo-3.svg', alt: 'Mountains at night' }
};

const meta: Meta<ArticleCardComponent> = {
    title: 'UI/Article card',
    component: ArticleCardComponent,
    decorators: [moduleMetadata({ imports: [ArticleCardLinkDirective, BylineComponent] })],
    argTypes: {
        layout: { control: RADIO, options: ['vertical', 'horizontal'] },
        variant: { control: RADIO, options: ['elevated', 'outlined', 'filled'] },
        color: { control: RADIO, options: ['neutral', 'primary', 'secondary'] }
    },
    args: {
        layout: 'vertical',
        variant: 'elevated',
        color: 'neutral',
        category: 'Club news'
    },
    render: args => ({
        props: { ...args, image: IMAGES['hills'] },
        template: `
            <ui-article-card class="max-w-sm" [image]="image" [category]="category" [layout]="layout" [variant]="variant" [color]="color">
                <a uiArticleCardLink href="#summer-party">Summer party on the club grounds</a>
                <p>Games for the kids, music in the evening and the best cake of the season. Everyone is welcome.</p>
                <ui-byline author="Ada Lovelace" date="2026-07-03" [readingTime]="3" />
            </ui-article-card>
        `
    })
};
export default meta;

type Story = StoryObj<ArticleCardComponent>;

export const Playground: Story = {};

// the grid is the page's: next to each other, every card is as high as the highest of its row, and their bylines line up.
export const Grid: Story = {
    render: () => ({
        props: { images: IMAGES },
        template: `
            <div class="grid gap-4 md:grid-cols-3">
                <ui-article-card category="Club news" [image]="images.hills">
                    <a uiArticleCardLink href="#summer-party">Summer party on the club grounds</a>
                    <p>Games for the kids, music in the evening and the best cake of the season.</p>
                    <ui-byline author="Ada Lovelace" date="2026-07-03" [readingTime]="3" />
                </ui-article-card>
                <ui-article-card category="Swimming" [image]="images.sea">
                    <a uiArticleCardLink href="#open-water">Open water season starts</a>
                    <p>From June on, the lake is ours every Saturday morning.</p>
                    <ui-byline author="Grace Hopper" date="2026-05-28" />
                </ui-article-card>
                <ui-article-card [image]="images.night">
                    <a uiArticleCardLink href="#night-run">A night run with a title that takes more than one line</a>
                    <p>Headlamps on: our first night run goes through the forest and ends with soup at the club house.</p>
                    <ui-byline author="Alan Turing" date="2026-11-02" [readingTime]="6" />
                </ui-article-card>
            </div>
        `
    })
};

// the image next to the text once the card is wide enough, above it on a narrow one.
export const Horizontal: Story = {
    render: () => ({
        props: { images: IMAGES },
        template: `
            <div class="grid gap-4">
                <ui-article-card class="max-w-3xl" layout="horizontal" category="Club news" [image]="images.hills">
                    <a uiArticleCardLink href="#summer-party">Summer party on the club grounds</a>
                    <p>Games for the kids, music in the evening and the best cake of the season. Everyone is welcome.</p>
                    <ui-byline author="Ada Lovelace" date="2026-07-03" [readingTime]="3" showAvatar />
                </ui-article-card>
                <ui-article-card class="max-w-xs" layout="horizontal" category="Club news" [image]="images.sea">
                    <a uiArticleCardLink href="#open-water">Too narrow for the image next to the text</a>
                    <ui-byline date="2026-05-28" />
                </ui-article-card>
            </div>
        `
    })
};

// without an image, with links of its own in the excerpt, which keep working on their own.
export const TextOnly: Story = {
    render: () => ({
        template: `
            <ui-article-card class="max-w-sm" category="Board">
                <a uiArticleCardLink href="#meeting">General meeting</a>
                <p>The agenda and the <a class="text-primary underline" href="#minutes">minutes of last year</a> are online.</p>
                <ui-byline date="2026-03-12" />
            </ui-article-card>
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
                        <ui-article-card category="News" [variant]="variant" [color]="color">
                            <a uiArticleCardLink href="#article">{{ variant }} {{ color }}</a>
                            <p>An excerpt of the article.</p>
                            <ui-byline author="Ada Lovelace" date="2026-07-03" />
                        </ui-article-card>
                    }
                }
            </div>
        `
    })
};
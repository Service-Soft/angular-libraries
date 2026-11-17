import { NgOptimizedImage } from '@angular/common';
import { Component, computed, contentChild, ElementRef, inject, input, InputSignal, Signal } from '@angular/core';
import { BadgeComponent } from '@service-soft/ui/badge';
import { CARD_CONFIG, CardColor, CardComponent, CardConfig, CardVariant } from '@service-soft/ui/card';
import { HeadingComponent, HeadingLevel } from '@service-soft/ui/heading';

import { ArticleCardConfig } from './article-card-config.model';
import { ARTICLE_CARD_CONFIG } from './article-card-config.provider';
import { ArticleCardImage } from './article-card-image.model';
import { ArticleCardLayout } from './article-card-layout.type';
import { ArticleCardLinkDirective } from './article-card-link.directive';

// what a click on the text of the card leaves alone, as it does something of its own.
const INTERACTIVE_SELECTOR: string = 'a, button, input, select, textarea, summary, label, [tabindex]';

// relative, so the link stretches over the card. An elevated card can be hovered, so it rises one level.
const CARD_CLASSES: Record<CardVariant, string> = {
    elevated: 'group relative h-full transition-shadow hover:shadow-2',
    outlined: 'group relative h-full',
    filled: 'group relative h-full'
};

// the card is flush, so the image goes up to its edges and the text brings its own padding.
const LAYOUT_CLASSES: Record<ArticleCardLayout, string> = {
    vertical: 'flex h-full flex-col',
    horizontal: 'flex h-full flex-col @xl:flex-row'
};

// the image keeps its aspect ratio above the text, and takes the height of the text next to it. It has the corners of
// the card where it touches them, which only the image clips: a card that clipped would cut off the focus ring of the
// link around it. The corners are logical, so they follow a right-to-left language.
const IMAGE_CLASSES: Record<ArticleCardLayout, string> = {
    vertical: 'relative aspect-video shrink-0 overflow-hidden rounded-ss-card rounded-se-card',
    horizontal: `
        relative aspect-video shrink-0 overflow-hidden rounded-ss-card rounded-se-card
        @xl:aspect-auto @xl:min-h-48 @xl:w-2/5 @xl:rounded-se-none @xl:rounded-es-card
    `
};

/**
 * An article on a card, like a post of a club or a blog: its cover image, a category, the title as your own link,
 * and your content below, like an excerpt and a `<ui-byline>`:
 * `<ui-article-card [image]="{ src, alt }" category="News"><a uiArticleCardLink routerLink="…">Title</a><p>…</p></ui-article-card>`.
 * The link stretches over the whole card, so the card is one target; the text below stays selectable, and a click on it
 * that selects nothing follows the link as well. Links and buttons of your content keep working on their own.
 * Place the cards with a grid of your own; next to each other, every card is as high as the highest of its row.
 * Unset inputs fall back to the values provided with provideArticleCardConfig, the look of the card to the ones of
 * provideCardConfig.
 */
@Component({
    selector: 'ui-article-card',
    templateUrl: './article-card.component.html',
    imports: [BadgeComponent, CardComponent, HeadingComponent, NgOptimizedImage],
    host: {
        // a container, so the horizontal layout puts the image next to the text by the width of the card, which works
        // in a narrow column of a wide screen as well.
        class: 'block @container',
        '(click)': 'followLink($event)'
    }
})
export class ArticleCardComponent {
    private readonly config: ArticleCardConfig = inject(ARTICLE_CARD_CONFIG);
    private readonly cardConfig: CardConfig = inject(CARD_CONFIG);
    private readonly link: Signal<ElementRef<HTMLAnchorElement>> = contentChild.required(ArticleCardLinkDirective, { read: ElementRef });

    /**
     * The cover image. Without one, the card only has text.
     */
    readonly image: InputSignal<ArticleCardImage | undefined> = input<ArticleCardImage>();

    /**
     * The category, as a badge above the title, like 'Club news'.
     */
    readonly category: InputSignal<string | undefined> = input<string>();

    /**
     * The level of the heading of the title, which fits the headings of the page. The default comes from
     * provideArticleCardConfig.
     */
    readonly headingLevel: InputSignal<HeadingLevel> = input<HeadingLevel>(this.config.headingLevel);

    /**
     * Where the image is: above the text, or next to it once the card is at least 36rem wide. The default comes from
     * provideArticleCardConfig.
     */
    readonly layout: InputSignal<ArticleCardLayout> = input<ArticleCardLayout>(this.config.layout);

    /**
     * How the card is set apart from what is around it. The default comes from provideCardConfig.
     */
    readonly variant: InputSignal<CardVariant> = input<CardVariant>(this.cardConfig.variant);

    /**
     * The color of the card. The default comes from provideCardConfig.
     */
    readonly color: InputSignal<CardColor> = input<CardColor>(this.cardConfig.color);

    /**
     * The tailwind classes of the card.
     */
    protected readonly cardClasses: Signal<string> = computed(() => CARD_CLASSES[this.variant()]);

    /**
     * The tailwind classes of the content of the card.
     */
    protected readonly layoutClasses: Signal<string> = computed(() => LAYOUT_CLASSES[this.layout()]);

    /**
     * The tailwind classes of the box of the image.
     */
    protected readonly imageClasses: Signal<string> = computed(() => IMAGE_CLASSES[this.layout()]);

    /**
     * Follows the link on a click on the text of the card, which lies above the link to stay selectable.
     * @param event - The click on the card.
     */
    // only a plain click of the main button: a click that selected text, one with a modifier key, which the browser
    // would open in a new tab or window, or one on something interactive of the content isn't meant for the link.
    // Everywhere else the link lies on top, so the browser follows it itself.
    protected followLink(event: MouseEvent): void {
        const target: EventTarget | null = event.target;
        if (
            event.defaultPrevented
            || event.button !== 0
            || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey
            || !(target instanceof Element)
            || target.closest(INTERACTIVE_SELECTOR) != undefined
            || (target.ownerDocument.getSelection()?.toString() ?? '') !== ''
        ) {
            return;
        }
        this.link().nativeElement.click();
    }
}
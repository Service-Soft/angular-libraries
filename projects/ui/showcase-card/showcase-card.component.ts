import { NgOptimizedImage } from '@angular/common';
import { Component, inject, input, InputSignal } from '@angular/core';
import { BadgeComponent } from '@service-soft/ui/badge';
import { CARD_CONFIG, CardColor, CardComponent, CardConfig, CardVariant } from '@service-soft/ui/card';
import { DatePeriodComponent, DatePeriodDate, DatePeriodEnd, DatePeriodFormat, DATE_PERIOD_CONFIG } from '@service-soft/ui/date-period';
import { HeadingComponent, HeadingLevel } from '@service-soft/ui/heading';

import { ShowcaseCardConfig } from './showcase-card-config.model';
import { SHOWCASE_CARD_CONFIG } from './showcase-card-config.provider';
import { ShowcaseCardImage } from './showcase-card-image.model';
import { ShowcaseCardLogo } from './showcase-card-logo.model';

/**
 * Something you show off on a card, like a reference, a project, an event or a product: its image, title, period,
 * summary, tags and logos, an optional longer text the user opens, and your own links at the bottom:
 * `<ui-showcase-card title="New website" start="2022-02" end="open" summary="…" [tags]="['Angular']"><a ui-link …>Read more</a></ui-showcase-card>`.
 * The longer text is a `<ui-showcase-card-details>`, whose first lines show below the summary, with a button that
 * shows all of it. Place the cards with a grid of your
 * own; next to each other, every card is as high as the highest of its row, and their links line up at the bottom.
 * Unset inputs fall back to the values provided with provideShowcaseCardConfig, the look of the card to the ones of
 * provideCardConfig and the format of the period to the one of provideDatePeriodConfig.
 */
@Component({
    selector: 'ui-showcase-card',
    templateUrl: './showcase-card.component.html',
    imports: [BadgeComponent, CardComponent, DatePeriodComponent, HeadingComponent, NgOptimizedImage],
    host: {
        class: 'block'
    }
})
export class ShowcaseCardComponent {
    private readonly config: ShowcaseCardConfig = inject(SHOWCASE_CARD_CONFIG);
    private readonly cardConfig: CardConfig = inject(CARD_CONFIG);

    /**
     * The title, as the heading of the card.
     */
    readonly title: InputSignal<string> = input.required<string>();

    /**
     * The image at the top. Without one, the card only has text.
     */
    readonly image: InputSignal<ShowcaseCardImage | undefined> = input<ShowcaseCardImage>();

    /**
     * When it started, or the date of something on one day, like an event.
     */
    readonly start: InputSignal<DatePeriodDate | undefined> = input<DatePeriodDate>();

    /**
     * When it ended, 'open' for something that is still going on, like '02/2022 – today'.
     */
    readonly end: InputSignal<DatePeriodEnd> = input<DatePeriodEnd>();

    /**
     * How the dates of the period are written. The default comes from provideDatePeriodConfig.
     */
    readonly periodFormat: InputSignal<DatePeriodFormat> = input<DatePeriodFormat>(inject(DATE_PERIOD_CONFIG).format);

    /**
     * A short text about it, below the title.
     */
    readonly summary: InputSignal<string | undefined> = input<string>();

    /**
     * Keywords about it, like the technologies of a project or the kind of an event.
     */
    readonly tags: InputSignal<string[]> = input<string[]>([]);

    /**
     * Logos that belong to it, like the one of the customer.
     */
    readonly logos: InputSignal<ShowcaseCardLogo[]> = input<ShowcaseCardLogo[]>([]);

    /**
     * The level of the heading, which fits the headings of the page. The default comes from provideShowcaseCardConfig.
     */
    readonly headingLevel: InputSignal<HeadingLevel> = input<HeadingLevel>(this.config.headingLevel);

    /**
     * How the card is set apart from what is around it. The default comes from provideCardConfig.
     */
    readonly variant: InputSignal<CardVariant> = input<CardVariant>(this.cardConfig.variant);

    /**
     * The color of the card. The default comes from provideCardConfig.
     */
    readonly color: InputSignal<CardColor> = input<CardColor>(this.cardConfig.color);

    /**
     * What screen readers call the list of tags.
     */
    protected readonly tagsLabel: string = this.config.tagsLabel;
}
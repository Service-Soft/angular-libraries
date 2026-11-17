import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, Signal } from '@angular/core';
import { BadgeComponent } from '@service-soft/ui/badge';
import { CARD_CONFIG, CardColor, CardComponent } from '@service-soft/ui/card';
import { HeadingComponent, HeadingLevel } from '@service-soft/ui/heading';

import { PricingCardConfig } from './pricing-card-config.model';
import { PRICING_CARD_CONFIG } from './pricing-card-config.provider';

/**
 * A plan with its price, like a membership or a product, on a card: the name of the plan as a heading, an optional
 * description, and your own content for the rest, a `<ui-price>`, the features, like a `<ui-check-list>`, and
 * `<ui-pricing-card-actions>` at the bottom: `<ui-pricing-card name="Family" highlighted><ui-price [amount]="25"
 * period="month" /><ui-check-list>…</ui-check-list><ui-pricing-card-actions><a ui-button href="/join">Join</a>
 * </ui-pricing-card-actions></ui-pricing-card>`. A highlighted plan, like the recommended one, gets the color of
 * highlightColor and a badge. Next to each other in a grid, every card is as high as the highest of its row, with the
 * actions at the same height.
 * The card follows provideCardConfig, unset inputs fall back to the values provided with providePricingCardConfig.
 */
@Component({
    selector: 'ui-pricing-card',
    templateUrl: './pricing-card.component.html',
    imports: [BadgeComponent, CardComponent, HeadingComponent],
    host: {
        class: 'block'
    }
})
export class PricingCardComponent {
    private readonly config: PricingCardConfig = inject(PRICING_CARD_CONFIG);

    private readonly cardColor: CardColor = inject(CARD_CONFIG).color;

    /**
     * The name of the plan, its heading, like 'Family'.
     */
    readonly name: InputSignal<string> = input.required<string>();

    /**
     * A sentence about the plan below its name, like who it is for.
     */
    readonly description: InputSignal<string | undefined> = input<string>();

    /**
     * Whether the plan stands out from the others, like the recommended one: its card gets the highlightColor of
     * providePricingCardConfig and a badge.
     */
    readonly highlighted: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The text of the badge of a highlighted plan. The default comes from providePricingCardConfig.
     */
    readonly badge: InputSignal<string> = input<string>(this.config.badge);

    /**
     * The level of the heading the name is, like 3 below the h2 of the section of the plans. The default comes from
     * providePricingCardConfig.
     */
    readonly headingLevel: InputSignal<HeadingLevel> = input<HeadingLevel>(this.config.headingLevel);

    /**
     * The color of the card.
     */
    protected readonly color: Signal<CardColor> = computed(() => this.highlighted() ? this.config.highlightColor : this.cardColor);
}
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { AvatarComponent } from '@service-soft/ui/avatar';
import { CardComponent } from '@service-soft/ui/card';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { RATING_CONFIG, RatingComponent } from '@service-soft/ui/rating';

import { TestimonialConfig } from './testimonial-config.model';
import { TESTIMONIAL_CONFIG } from './testimonial-config.provider';
import { TestimonialVariant } from './testimonial-variant.type';

// a quote is a container, so it decides by its own width whether the portrait fits beside the quote. A card is none:
// a container can't take the width of its content, which would collapse a card in a row of a flex layout.
const HOST_CLASSES: Record<TestimonialVariant, string> = {
    card: 'block',
    quote: 'block @container'
};

/**
 * What a person says about you, like a member about a club or a customer about a product: the quote as your own
 * content, `<ui-testimonial name="Ada Lovelace" subtitle="Member since 2019" [rating]="5"><p>…</p></ui-testimonial>`,
 * with the person below it and optionally a rating as stars above it. As a card, the default, it follows
 * provideCardConfig, and grows to the height of its row, so testimonials next to each other in a grid are equally high.
 * As a quote, it is the large text of the quote with a portrait of the person beside it, from the avatar.
 * Unset inputs fall back to the values provided with provideTestimonialConfig.
 */
@Component({
    selector: 'ui-testimonial',
    templateUrl: './testimonial.component.html',
    imports: [AvatarComponent, CardComponent, IconComponent, NgTemplateOutlet, RatingComponent],
    host: {
        '[class]': 'hostClasses()'
    }
})
export class TestimonialComponent {
    private readonly config: TestimonialConfig = inject(TESTIMONIAL_CONFIG);

    /**
     * How it looks: a card, or a large quote with a portrait of the person beside it. The default comes from
     * provideTestimonialConfig.
     */
    readonly variant: InputSignal<TestimonialVariant> = input<TestimonialVariant>(this.config.variant);

    /**
     * The tailwind classes of the element itself.
     */
    protected readonly hostClasses: Signal<string> = computed(() => HOST_CLASSES[this.variant()]);

    /**
     * The name of the person.
     */
    readonly name: InputSignal<string> = input.required<string>();

    /**
     * What sets the person apart, below their name, like 'Member since 2019' or their company.
     */
    readonly subtitle: InputSignal<string | undefined> = input<string>();

    /**
     * The url of a picture of the person. Without one, their initials show on a card, and a quote has no portrait.
     */
    readonly avatar: InputSignal<string | undefined> = input<string>();

    /**
     * The rating the person gave, from 0 to max, shown as stars. Without one, there are no stars.
     */
    readonly rating: InputSignal<number | undefined> = input<number>();

    /**
     * How many stars there are. The default comes from provideRatingConfig.
     */
    readonly max: InputSignal<number> = input<number>(inject(RATING_CONFIG).max);

    /**
     * The quotation mark above the quote.
     */
    protected readonly quoteIcon: IconDefinition = faQuoteLeft;
}
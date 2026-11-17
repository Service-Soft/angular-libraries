import { Component, computed, HostAttributeToken, inject, input, InputSignal, LOCALE_ID, Signal } from '@angular/core';
import { LINK_CONFIG } from '@service-soft/ui/link';
import { RATING_CONFIG, RatingComponent, RatingUtilities } from '@service-soft/ui/rating';

import { RatingBadgeConfig } from './rating-badge-config.model';
import { RATING_BADGE_CONFIG } from './rating-badge-config.provider';
import { RatingBadgeLogo } from './rating-badge-logo.model';

// a pill on the surface, raised like a card, so it stands out on a picture as well. Hovering raises it one level more.
// The transparent border keeps its shape in forced colors mode, which removes shadows and backgrounds.
const BADGE_CLASSES: string = `
    inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-rating-badge border border-transparent bg-surface px-3 py-1 text-label-lg
    text-on-surface shadow-1 transition
    hover:shadow-2
    active:shadow-1
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
`;

/**
 * A link to the ratings of a site, like the reviews on Google, which shows the logo of the site, the rating as stars
 * and its value: `<a ui-rating-badge href="https://…" target="_blank" [value]="4.4">`. It stays your own link, so href,
 * target and routerLink work as on any link. Screen readers read the name of the site and the rating, like
 * 'Google, 4.4 out of 5 stars', and that it opens in a new tab, when it has a static target="_blank".
 * Unset inputs fall back to the values provided with provideRatingBadgeConfig, max to the one of provideRatingConfig.
 */
@Component({
    selector: 'a[ui-rating-badge]',
    templateUrl: './rating-badge.component.html',
    imports: [RatingComponent],
    host: {
        '[class]': 'classes'
    }
})
export class RatingBadgeComponent {
    private readonly config: RatingBadgeConfig = inject(RATING_BADGE_CONFIG);

    /**
     * The tailwind classes of the badge.
     */
    protected readonly classes: string = BADGE_CLASSES;

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The rating, from 0 to max, like 4.4.
     */
    readonly value: InputSignal<number> = input.required<number>();

    /**
     * How many stars there are. The default comes from provideRatingConfig.
     */
    readonly max: InputSignal<number> = input<number>(inject(RATING_CONFIG).max);

    /**
     * The logo of the site the rating is from. The default comes from provideRatingBadgeConfig, which is Google.
     */
    readonly logo: InputSignal<RatingBadgeLogo> = input<RatingBadgeLogo>(this.config.logo);

    /**
     * The value as it shows, like '4.4'.
     */
    protected readonly formattedValue: Signal<string> = computed(() => RatingUtilities.formatValue(this.value(), this.locale));

    // the badge is no ui-link, which follows a bound target as well, but it says the same about a new tab. Ratings link
    // to one site, so a static target is enough.
    /**
     * Whether the link opens in a new tab.
     */
    protected readonly opensNewTab: boolean = inject(new HostAttributeToken('target'), { optional: true }) === '_blank';

    /**
     * Read after the rating when the link opens in a new tab.
     */
    protected readonly newTabLabel: string = inject(LINK_CONFIG).newTabLabel;
}
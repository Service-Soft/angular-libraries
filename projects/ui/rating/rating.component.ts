import { Component, computed, inject, input, InputSignal, LOCALE_ID, Signal } from '@angular/core';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { RatingConfig } from './rating-config.model';
import { RATING_CONFIG } from './rating-config.provider';
import { RatingUtilities } from './rating.utilities';

/**
 * A rating as stars, like 4.4 out of 5, filled up to the exact value. It only shows a rating, the user can't give one.
 * Screen readers read it as one image, like '4.4 out of 5 stars'. The stars are as large as the text around them.
 * Unset inputs fall back to the values provided with provideRatingConfig.
 */
@Component({
    selector: 'ui-rating',
    templateUrl: './rating.component.html',
    imports: [IconComponent],
    host: {
        // no box of its own, like an icon, so the stars sit in the layout as if there was no wrapper.
        class: 'contents'
    }
})
export class RatingComponent {
    private readonly config: RatingConfig = inject(RATING_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The rating, from 0 to max, like 4.4. Values outside of that fill no or all stars.
     */
    readonly value: InputSignal<number> = input.required<number>();

    /**
     * How many stars there are. The default comes from provideRatingConfig.
     */
    readonly max: InputSignal<number> = input<number>(this.config.max);

    /**
     * The icon of a star.
     */
    protected readonly starIcon: IconDefinition = faStar;

    /**
     * One entry for each star.
     */
    protected readonly stars: Signal<number[]> = computed(() => Array.from({ length: this.max() }, (_, index) => index));

    /**
     * What screen readers read for the stars.
     */
    protected readonly label: Signal<string> = computed(() => {
        return this.config.label(RatingUtilities.formatValue(this.value(), this.locale), this.max());
    });

    /**
     * How wide the filled stars are, in em.
     */
    protected readonly fillWidth: Signal<number> = computed(() => RatingUtilities.calculateFillWidth(this.value(), this.max()));
}
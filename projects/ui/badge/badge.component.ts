import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';

import { BadgeColor } from './badge-color.type';
import { BadgeConfig } from './badge-config.model';
import { BADGE_CONFIG } from './badge-config.provider';
import { BadgeSize } from './badge-size.type';
import { BadgeVariant } from './badge-variant.type';

// a min-h instead of a fixed height and no whitespace-nowrap, so a label that grows with the text or doesn't fit a
// narrow screen wraps and makes the badge taller. Icons are svgs inside, sized in em and drawn in the text color.
const BASE_CLASSES: string = `
    inline-flex max-w-full items-center gap-1 rounded-badge border text-center wrap-break-word
    [&_svg]:size-[1em] [&_svg]:shrink-0
`;

const SIZE_CLASSES: Record<BadgeSize, string> = {
    sm: 'min-h-5 px-2 py-0.5 text-label-sm',
    md: 'min-h-6 px-3 py-0.5 text-label'
};

// only pairs whose contrast is checked: the on- color on its color, the -text color on its tint, and the surface
// colors, which are on-surface on the surface the other way round for a filled neutral badge. A colored surface gives
// all of them its own values, so a badge keeps its contrast there; status colors keep theirs, like their text does.
// secondary and success are too light for text on their tints, so those use their -text tokens. The transparent borders
// keep the shape of the badge in forced colors mode, which removes backgrounds; a tinted neutral badge has a visible one,
// like a chip, as its tint is the container color, which sets it apart from little else.
const VARIANT_CLASSES: Record<BadgeVariant, Record<BadgeColor, string>> = {
    filled: {
        neutral: 'border-transparent bg-on-surface text-surface',
        primary: 'border-transparent bg-primary text-on-primary',
        secondary: 'border-transparent bg-secondary text-on-secondary',
        error: 'border-transparent bg-error text-on-error',
        success: 'border-transparent bg-success text-on-success'
    },
    tinted: {
        neutral: 'border-outline-variant bg-surface-container text-on-surface',
        primary: 'border-transparent bg-primary-tint text-primary',
        secondary: 'border-transparent bg-secondary-tint text-secondary-text',
        error: 'border-transparent bg-error-tint text-error',
        success: 'border-transparent bg-success-tint text-success-text'
    }
};

/**
 * A short label that nothing happens on, like the category of an article, a tag or 'Recommended':
 * `<ui-badge color="primary">News</ui-badge>`. An icon of your own inside it is sized and colored with its text. Several
 * badges of a kind, like tags, are a list of their own: `<ul class="flex flex-wrap gap-2"><li><ui-badge>…</ui-badge></li></ul>`.
 * For something the user can remove or choose, use the chips of `@service-soft/ui/input-chips` or a button instead.
 * Unset inputs fall back to the values provided with provideBadgeConfig.
 */
@Component({
    selector: 'ui-badge',
    templateUrl: './badge.component.html',
    host: {
        '[class]': 'classes()'
    }
})
export class BadgeComponent {
    private readonly config: BadgeConfig = inject(BADGE_CONFIG);

    /**
     * Its color. The default comes from provideBadgeConfig.
     */
    readonly color: InputSignal<BadgeColor> = input<BadgeColor>(this.config.color);

    /**
     * How much it stands out: filled with its color, or its color as text on a tint of it. The default comes from
     * provideBadgeConfig.
     */
    readonly variant: InputSignal<BadgeVariant> = input<BadgeVariant>(this.config.variant);

    /**
     * Its size. The default comes from provideBadgeConfig.
     */
    readonly size: InputSignal<BadgeSize> = input<BadgeSize>(this.config.size);

    /**
     * The tailwind classes of the badge.
     */
    protected readonly classes: Signal<string> = computed(() => {
        return [BASE_CLASSES, SIZE_CLASSES[this.size()], VARIANT_CLASSES[this.variant()][this.color()]].join(' ');
    });
}
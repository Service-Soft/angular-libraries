import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { HeadingComponent, HeadingLevel } from '@service-soft/ui/heading';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { EmptyStateConfig } from './empty-state-config.model';
import { EMPTY_STATE_CONFIG } from './empty-state-config.provider';
import { EmptyStateSize } from './empty-state-size.type';
import { EmptyStateVariant } from './empty-state-variant.type';

const SIZE_CLASSES: Record<EmptyStateSize, string> = {
    md: 'flex flex-col items-center gap-3 px-6 py-12 text-center',
    compact: 'flex flex-col items-center gap-2 px-4 py-6 text-center'
};

// sized in em, like every icon, so it grows with the text.
const ICON_SIZE_CLASSES: Record<EmptyStateSize, string> = {
    md: 'flex [&_svg]:size-[2.5em]',
    compact: 'flex [&_svg]:size-[1.75em]'
};

// the tone of the variant is the color of the icon. The title says what happened, so the color is no cue of its own.
const ICON_COLOR_CLASSES: Record<EmptyStateVariant, string> = {
    empty: 'text-on-surface-variant',
    'no-results': 'text-on-surface-variant',
    error: 'text-error'
};

const TITLE_CLASSES: Record<EmptyStateSize, string> = {
    md: 'font-heading text-title text-on-surface',
    compact: 'text-label-lg text-on-surface'
};

/**
 * Says that there is nothing to show, and why, in place of what would be there, like the orders of a new customer, the
 * results of a search or a list that couldn't be loaded: an icon of its variant, a title, a text, and
 * `<ui-empty-state-actions>` with what the user can do about it, like a button that creates the first order.
 * The compact size is for the inside of a table or a list, which ui-table shows on its own.
 * Unset inputs fall back to the values provided with provideEmptyStateConfig.
 */
@Component({
    selector: 'ui-empty-state',
    templateUrl: './empty-state.component.html',
    imports: [HeadingComponent, IconComponent],
    host: {
        class: 'block'
    }
})
export class EmptyStateComponent {
    private readonly config: EmptyStateConfig = inject(EMPTY_STATE_CONFIG);

    /**
     * What there is not, like 'No orders yet'.
     */
    readonly title: InputSignal<string> = input.required<string>();

    /**
     * More about it below the title, like how to get the first order.
     */
    readonly text: InputSignal<string | undefined> = input<string>();

    /**
     * Why there is nothing to show, which picks the icon and its color: nothing yet, nothing matches, or an error.
     */
    readonly variant: InputSignal<EmptyStateVariant> = input<EmptyStateVariant>(this.config.variant);

    /**
     * How much room it takes: the content of a page or a card, or compact, like inside a table or a list.
     */
    readonly size: InputSignal<EmptyStateSize> = input<EmptyStateSize>(this.config.size);

    /**
     * The level of the heading its title is, or undefined for a title that is no heading, like inside a table.
     */
    readonly headingLevel: InputSignal<HeadingLevel | undefined> = input<HeadingLevel | undefined>(this.config.headingLevel);

    /**
     * An icon in place of the one of the variant.
     */
    readonly icon: InputSignal<IconDefinition | undefined> = input<IconDefinition>();

    /**
     * The icon that shows.
     */
    protected readonly shownIcon: Signal<IconDefinition> = computed(() => this.icon() ?? this.config.icons[this.variant()]);

    /**
     * The tailwind classes of the box.
     */
    protected readonly classes: Signal<string> = computed(() => SIZE_CLASSES[this.size()]);

    /**
     * The tailwind classes around the icon.
     */
    protected readonly iconClasses: Signal<string> = computed(
        () => `${ICON_SIZE_CLASSES[this.size()]} ${ICON_COLOR_CLASSES[this.variant()]}`
    );

    /**
     * The tailwind classes of the title.
     */
    protected readonly titleClasses: Signal<string> = computed(() => TITLE_CLASSES[this.size()]);
}
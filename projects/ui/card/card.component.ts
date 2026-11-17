import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, Signal } from '@angular/core';

import { CardColor } from './card-color.type';
import { CardConfig } from './card-config.model';
import { CARD_CONFIG } from './card-config.provider';
import { CardVariant } from './card-variant.type';

const BASE_CLASSES: string = 'block rounded-card border';

// a flush card leaves the padding to its content, so an image can go up to its edges.
const PADDING_CLASSES: Record<'padded' | 'flush', string> = {
    padded: 'p-4 sm:p-6',
    flush: ''
};

// like the card table: elevated sits on shadow-1, the level of cards. Elevated and filled have a transparent border,
// so their shape survives forced colors mode, which removes shadows and backgrounds but draws every border.
// In a theme color, an elevated card gets a bar at its top and an outlined one its border in the color; both are
// decorative, the content says what the card is, so they may use the lighter secondary. A filled one is a colored
// surface, which gives its content the on- colors of it, like a primary drawer, so its text, links and controls keep
// their checked contrast.
const VARIANT_CLASSES: Record<CardVariant, Record<CardColor, string>> = {
    elevated: {
        neutral: 'border-transparent bg-surface text-on-surface shadow-1',
        primary: 'border-transparent border-t-4 border-t-primary bg-surface text-on-surface shadow-1',
        secondary: 'border-transparent border-t-4 border-t-secondary bg-surface text-on-surface shadow-1'
    },
    outlined: {
        neutral: 'border-outline-variant bg-surface text-on-surface',
        primary: 'border-primary bg-surface text-on-surface',
        secondary: 'border-secondary bg-surface text-on-surface'
    },
    filled: {
        neutral: 'border-transparent bg-surface-container text-on-surface',
        primary: 'border-transparent surface-primary',
        secondary: 'border-transparent surface-secondary'
    }
};

/**
 * A surface that groups related content, like a widget of a dashboard. Put a heading of your own inside, in the level
 * that fits the page.
 * Unset inputs fall back to the values provided with provideCardConfig.
 */
@Component({
    selector: 'ui-card',
    templateUrl: './card.component.html',
    host: {
        '[class]': 'classes()'
    }
})
export class CardComponent {
    private readonly config: CardConfig = inject(CARD_CONFIG);

    /**
     * How the card is set apart from what is around it: raised by a shadow, outlined with a border, or filled with the
     * container color.
     */
    readonly variant: InputSignal<CardVariant> = input<CardVariant>(this.config.variant);

    /**
     * The color of the card: filled, its background; outlined, its border; elevated, a bar at its top.
     */
    readonly color: InputSignal<CardColor> = input<CardColor>(this.config.color);

    /**
     * Whether the content goes up to the edges of the card, like an image at its top. The content then brings its own
     * padding.
     */
    readonly flush: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The tailwind classes of the card in its variant and color.
     */
    protected readonly classes: Signal<string> = computed(() => {
        return [BASE_CLASSES, PADDING_CLASSES[this.flush() ? 'flush' : 'padded'], VARIANT_CLASSES[this.variant()][this.color()]].join(' ');
    });
}
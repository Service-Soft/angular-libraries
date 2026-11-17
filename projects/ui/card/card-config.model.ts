import { CardColor } from './card-color.type';
import { CardVariant } from './card-variant.type';

/**
 * The values a card uses when its inputs are not set.
 */
export type CardConfig = {
    /**
     * How it is set apart from what is around it.
     */
    variant: CardVariant,
    /**
     * Its color.
     */
    color: CardColor
};
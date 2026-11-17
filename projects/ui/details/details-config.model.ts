import { DetailsColor } from './details-color.type';
import { DetailsVariant } from './details-variant.type';

/**
 * The values a details section uses when its inputs are not set.
 */
export type DetailsConfig = {
    /**
     * How it looks.
     */
    variant: DetailsVariant,
    /**
     * Its accent.
     */
    color: DetailsColor
};
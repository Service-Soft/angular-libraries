import { BadgeColor } from './badge-color.type';
import { BadgeSize } from './badge-size.type';
import { BadgeVariant } from './badge-variant.type';

/**
 * The values a badge uses when its inputs are not set.
 */
export type BadgeConfig = {
    /**
     * Its color.
     */
    color: BadgeColor,
    /**
     * How much it stands out.
     */
    variant: BadgeVariant,
    /**
     * Its size.
     */
    size: BadgeSize
};
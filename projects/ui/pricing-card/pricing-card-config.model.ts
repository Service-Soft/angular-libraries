import { CardColor } from '@service-soft/ui/card';
import { HeadingLevel } from '@service-soft/ui/heading';

/**
 * The values a pricing card uses when its inputs are not set.
 */
export type PricingCardConfig = {
    /**
     * The level of the heading the name of the plan is.
     */
    headingLevel: HeadingLevel,
    /**
     * The text of the badge of a highlighted plan.
     */
    badge: string,
    /**
     * The color of the card of a highlighted plan, in the variant of provideCardConfig.
     */
    highlightColor: CardColor
};
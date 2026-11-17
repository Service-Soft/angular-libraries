import { HeadingLevel } from '@service-soft/ui/heading';

import { PersonCardLayout } from './person-card-layout.type';

/**
 * The values a person card uses when its inputs are not set.
 */
export type PersonCardConfig = {
    /**
     * How the card is laid out.
     */
    layout: PersonCardLayout,
    /**
     * The level of the heading the name is.
     */
    headingLevel: HeadingLevel
};
import { HeadingLevel } from '@service-soft/ui/heading';
import { IconDefinition } from '@service-soft/ui/icon';

import { EmptyStateSize } from './empty-state-size.type';
import { EmptyStateVariant } from './empty-state-variant.type';

/**
 * The values an empty state uses when its inputs are not set.
 */
export type EmptyStateConfig = {
    /**
     * Why there is nothing to show.
     */
    variant: EmptyStateVariant,
    /**
     * How much room it takes.
     */
    size: EmptyStateSize,
    /**
     * The level of the heading its title is, or undefined for a title that is no heading.
     */
    headingLevel: HeadingLevel | undefined,
    /**
     * The icon of each variant.
     */
    icons: Record<EmptyStateVariant, IconDefinition>
};
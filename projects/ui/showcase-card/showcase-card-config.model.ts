import { HeadingLevel } from '@service-soft/ui/heading';

/**
 * The values a showcase card uses when its inputs are not set.
 */
export type ShowcaseCardConfig = {
    /**
     * The level of the heading.
     */
    headingLevel: HeadingLevel,
    /**
     * What screen readers call the list of tags.
     */
    tagsLabel: string
};
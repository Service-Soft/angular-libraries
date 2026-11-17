import { TableOfContentsLevel } from './table-of-contents-level.type';

/**
 * The values a table of contents uses when its inputs are not set.
 */
export type TableOfContentsConfig = {
    /**
     * The title above the links, which names the navigation for screen readers as well.
     */
    label: string,
    /**
     * The levels of the headings of a container that become links.
     */
    levels: TableOfContentsLevel[],
    /**
     * Whether the link of the section that is being read is highlighted while the page scrolls.
     */
    spy: boolean
};
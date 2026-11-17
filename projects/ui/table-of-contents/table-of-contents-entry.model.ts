/**
 * A link of a table of contents as it shows, with its href and the links of the sections inside of it.
 */
export type TableOfContentsEntry = {
    /**
     * The text of the link.
     */
    name: string,
    /**
     * The id of the element it links to.
     */
    fragment: string,
    /**
     * The path of the page with the fragment.
     */
    href: string,
    /**
     * The links of the sections inside of it.
     */
    children: TableOfContentsEntry[]
};
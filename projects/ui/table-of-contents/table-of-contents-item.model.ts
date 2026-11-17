/**
 * A section of the page a table of contents links to: the element whose id is the fragment, like a heading, and the
 * sections inside of it. Named like the anchors of @service-soft/ngx-navigation.
 */
export type TableOfContentsItem = {
    /**
     * The text of the link, like the text of the heading.
     */
    name: string,
    /**
     * The id of the element of the section, without the '#'.
     */
    fragment: string,
    /**
     * The sections inside of it, like the h3s below an h2.
     */
    children?: TableOfContentsItem[]
};
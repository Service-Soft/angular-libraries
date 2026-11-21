/**
 * A page of a route with parameters, as the sitemap lists it, like the page of one product of an api.
 */
export type NavSitemapEntry = {
    /**
     * The path of the page without its language, like '/products/42'.
     */
    path: string,
    /**
     * When the content of the page last changed, which the sitemap lists in the format search engines read. Search
     * engines only trust a date that is always right, so a page without a known date has none.
     */
    lastModified?: Date
};
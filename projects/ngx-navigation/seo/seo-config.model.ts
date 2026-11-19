/**
 * What every page tells search engines and AI assistants about itself, next to the data of its route. Set it with
 * provideSeoConfig.
 */
export type SeoConfig = {
    /**
     * The origin of the site, like 'https://example.com', which the canonical url of a page starts with, without a
     * slash at the end.
     */
    origin: string,
    /**
     * The image a shared link shows for a page without an `image` in its data, absolute or relative to the origin.
     * None when undefined.
     */
    defaultImage: string | undefined
};
import { SeoLocale } from './seo-locale.model';

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
    defaultImage: string | undefined,
    /**
     * The languages of the site, as Angular i18n builds them, the source language first. With more than one, a page
     * links to itself in each with hreflang, and to its url without a language as x-default. Empty for a site with one
     * language, whose pages have no prefix.
     */
    locales: SeoLocale[]
};
/**
 * A language of a site, as Angular i18n builds it: its code, and the path its pages are served below.
 */
export type SeoLocale = {
    /**
     * The code of the language, like 'en' or 'de-CH', which hreflang names it by.
     */
    code: string,
    /**
     * The path of its pages, like 'en' for /en/imprint, as the i18n.locales of angular.json name it. Empty for a site
     * with one language, whose pages have no prefix.
     */
    subPath: string
};
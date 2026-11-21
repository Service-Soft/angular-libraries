import { SeoLocale } from '@service-soft/ngx-navigation/seo';

/**
 * A page of a site in one of its languages.
 */
export type SeoLocalizedPage = {
    /**
     * The language.
     */
    locale: SeoLocale,
    /**
     * The absolute url of the page in the language.
     */
    url: string,
    /**
     * The title of the page in the language, as it renders it. Undefined for a page only a browser renders.
     */
    title: string | undefined,
    /**
     * The description of the page in the language, as it renders it. Undefined for a page without one, or only a
     * browser renders.
     */
    description: string | undefined
};
import { RenderMode } from '@angular/ssr';

import { SeoLocalizedPage } from './seo-localized-page.model';

/**
 * A page of a site that search engines may index, in every language of the site.
 */
export type SeoPage = {
    /**
     * The path of the page without its language, like '/imprint', or '/' for the start page.
     */
    path: string,
    /**
     * How Angular renders the page: when the site is built, for each request, or only in the browser.
     */
    renderMode: RenderMode,
    /**
     * When the content of the page last changed, from the data of its route. Undefined when not known.
     */
    lastModified: Date | undefined,
    /**
     * The page in each language of the site, in the order of the languages.
     */
    localized: SeoLocalizedPage[]
};
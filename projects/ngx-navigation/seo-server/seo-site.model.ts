import { SeoPage } from './seo-page.model';

/**
 * The pages of a site, as resolvePages finds them.
 */
export type SeoSite = {
    /**
     * Every page search engines may index.
     */
    pages: SeoPage[],
    /**
     * The routes with parameters whose pages could not be listed: Angular prerendered none of them, and their data has
     * no sitemap. Their pages are missing from the sitemap, which a server can warn about.
     */
    unlistedRoutes: string[],
    /**
     * The routes whose server route answers with an error, like one without a server route of its own that falls
     * under the 404 of the route of unknown urls. They are left out of the sitemap, which a server can warn about.
     */
    errorRoutes: string[]
};
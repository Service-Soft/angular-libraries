import { SeoSitemapRoute } from './seo-sitemap-route.model';

/**
 * The REQUEST_CONTEXT of the request SeoServerUtilities.resolvePages renders a page for, in which provideSeoConfig hands
 * the server the routes of the pages of the app, with what their data.sitemap lists, before the page renders.
 */
export type SeoSitemapContext = {
    /**
     * The routes of the pages. Undefined until the app handed them over.
     */
    ngxSeoSitemap: SeoSitemapRoute[] | undefined
};
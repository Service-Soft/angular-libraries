import { NavSitemapEntry } from '@service-soft/ngx-navigation/navigation';

/**
 * The REQUEST_CONTEXT of the request SeoServerUtilities.resolvePages renders a page for, in which provideSeoConfig runs
 * the data.sitemap of every route in the app, before the page renders.
 */
export type SeoSitemapContext = {
    /**
     * The pages data.sitemap lists, by the path of their route, like 'news/:article'. Undefined until the app ran them.
     */
    ngxSeoSitemap: Record<string, NavSitemapEntry[]> | undefined
};
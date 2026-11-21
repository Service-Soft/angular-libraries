import { NavSitemapEntry } from '@service-soft/ngx-navigation/navigation';

import { SeoPageRoute } from './seo-page-route.model';

/**
 * A route of the router config that renders a page, as the app hands it to SeoServerUtilities.resolvePages, with the
 * pages its data.sitemap lists.
 */
export type SeoSitemapRoute = SeoPageRoute & {
    /**
     * The pages data.sitemap lists, like the articles of a database. Undefined for a route without one.
     */
    listed: NavSitemapEntry[] | undefined
};
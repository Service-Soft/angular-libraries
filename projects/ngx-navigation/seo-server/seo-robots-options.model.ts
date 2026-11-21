/**
 * What the robots.txt of resolveRobotsTxt says.
 */
export type SeoRobotsOptions = {
    /**
     * Whether search engines may read the site, false for one like stage that is no site of its own.
     */
    allowed: boolean,
    /**
     * The crawlers that may read nothing even so, like the ones that collect content to train AI models.
     */
    disallowedCrawlers: string[],
    /**
     * The absolute url of the sitemap.
     */
    sitemapUrl: string
};
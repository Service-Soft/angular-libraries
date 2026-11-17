/**
 * Where a link to another site goes.
 */
export type NavUrlTarget = {
    /**
     * The url, like 'https://example.com'.
     */
    url: string,
    /**
     * Whether the link opens in a new tab.
     */
    openInNewTab?: boolean
};
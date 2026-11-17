/**
 * A visit of a page, as the CustomTrackingService sends it.
 */
export type TrackingVisit = {
    /**
     * Whether the visitor came for the first time within the first visit duration.
     */
    firstVisit: boolean,
    /**
     * The page the visitor came from, without protocol, query and hash, or '/' when there is none.
     */
    referrer: string,
    /**
     * The page the visitor opened, without query and hash.
     */
    targetSite: string,
    /**
     * The domain of the website.
     */
    domain: string
};
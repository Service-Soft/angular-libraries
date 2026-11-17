/**
 * Something that happened on the website, like a purchase, as the CustomTrackingService sends it.
 */
export type TrackingEvent = {
    /**
     * What happened, like 'Purchase'.
     */
    name: string,
    /**
     * The group the event belongs to, like 'Shop'.
     */
    category: string,
    /**
     * The page the visitor came from.
     */
    referrer: string,
    /**
     * The domain of the website.
     */
    domain: string
};
/**
 * The logo at the start of a rating badge, of the site the rating is from.
 */
export type RatingBadgeLogo = {
    /**
     * The url of the image, also a data url.
     */
    src: string,
    /**
     * The name of the site, which screen readers read before the rating, like 'Google'.
     */
    alt: string
};
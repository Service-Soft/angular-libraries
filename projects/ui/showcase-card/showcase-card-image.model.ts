/**
 * The image at the top of a showcase card. It is drawn with NgOptimizedImage, which lazy loads it and takes the image
 * loader of your app, so it can't be a data url.
 */
export type ShowcaseCardImage = {
    /**
     * The url of the image.
     */
    src: string,
    /**
     * What the image shows, for screen readers. Empty for an image that only decorates.
     */
    alt: string,
    /**
     * Whether the image loads right away with a high priority, for a card at the top of the page.
     */
    priority?: boolean
};
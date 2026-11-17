/**
 * A picture of a gallery. It is drawn with NgOptimizedImage, which lazy loads it and takes the image loader of your
 * app, so it can't be a data url.
 */
export type GalleryImage = {
    /**
     * The url of the picture.
     */
    src: string,
    /**
     * What the picture shows, for screen readers. Required, also as the name of the button that opens it.
     */
    alt: string,
    /**
     * A text below the picture while it is open, like who took it.
     */
    caption?: string
};
/**
 * The picture at the top of an option card, like the photo of a car. It is drawn with NgOptimizedImage, which lazy loads
 * it and takes the image loader of your app, so it can't be a data url.
 */
export type InputCardImage = {
    /**
     * The url of the image.
     */
    url: string,
    /**
     * The width of the image in pixels, which keeps its space while it loads.
     */
    width: number,
    /**
     * The height of the image in pixels.
     */
    height: number,
    /**
     * What the image shows, for screen readers. Empty by default, for a picture the title of the card describes already.
     */
    alt?: string
};
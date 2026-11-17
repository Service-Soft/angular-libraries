/**
 * A logo on a showcase card, like the one of a customer or of a partner. It is drawn with NgOptimizedImage, which needs
 * its size to reserve its space before it loads; it shows 2rem high, as wide as that makes it.
 */
export type ShowcaseCardLogo = {
    /**
     * The url of the logo.
     */
    src: string,
    /**
     * Whose logo it is, like 'Example Inc.'.
     */
    alt: string,
    /**
     * The width of the image in pixels.
     */
    width: number,
    /**
     * The height of the image in pixels.
     */
    height: number
};
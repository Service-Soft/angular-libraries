/**
 * A logo of a logo cloud as it shows, with everything decided.
 */
export type LogoCloudShownLogo = {
    /**
     * The url of the image.
     */
    src: string,
    /**
     * What the logo shows.
     */
    alt: string,
    /**
     * The width of the image in pixels.
     */
    width: number,
    /**
     * The height of the image in pixels.
     */
    height: number,
    /**
     * The height it shows in, a part of the token --spacing-logo-cloud, like 'calc(var(--spacing-logo-cloud) * 0.5)'.
     */
    shownHeight: string,
    /**
     * Where the logo links to, undefined for no link.
     */
    href: string | undefined,
    /**
     * Whether the link opens in a new tab.
     */
    opensNewTab: boolean,
    /**
     * Whether the image is loaded with NgOptimizedImage, which refuses data urls.
     */
    optimized: boolean
};
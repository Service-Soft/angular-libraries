/**
 * A logo of a logo cloud, like the one of a sponsor, a partner or a certificate.
 */
export type LogoCloudLogo = {
    /**
     * The url of the image, also a data url.
     */
    src: string,
    /**
     * What the logo shows, like the name of the sponsor. For a linked logo it is the name of the link as well.
     */
    alt: string,
    /**
     * The width of the image in pixels, which gives the page its aspect ratio before it loaded, so nothing moves.
     */
    width: number,
    /**
     * The height of the image in pixels. It shows as high as every other logo, the token --spacing-logo-cloud.
     */
    height: number,
    /**
     * Where the logo links to, like the website of the sponsor. Without one, it is no link.
     */
    href?: string,
    /**
     * Whether the link opens in a new tab. The default comes from provideLogoCloudConfig.
     */
    openInNewTab?: boolean
};
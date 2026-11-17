import { NavConditional } from './nav-conditional.model';
import { NavTarget } from './nav-target.type';

/**
 * An image, like the logo of the app.
 */
export type NavImage = NavConditional & {
    /**
     * Says that it is an image.
     */
    type: 'image',
    /**
     * The url of the image file.
     */
    url: string,
    /**
     * What the image shows, or where it links to when it has a link, like 'Home'. Empty for a decorative image.
     */
    alt: string,
    /**
     * The width of the image in pixels, so the page doesn't shift once it loaded.
     */
    width: number,
    /**
     * The height of the image in pixels, so the page doesn't shift once it loaded.
     */
    height: number,
    /**
     * Where the image links to. Just the image when there is none.
     */
    link?: NavTarget
};
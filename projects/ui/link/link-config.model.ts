import { LinkAppearance } from './link-appearance.type';

/**
 * The values a link uses when its inputs are not set.
 */
export type LinkConfig = {
    /**
     * How the link looks.
     */
    appearance: LinkAppearance,
    /**
     * Read after the text of a link that opens in a new tab, so screen reader users know before they follow it.
     */
    newTabLabel: string
};
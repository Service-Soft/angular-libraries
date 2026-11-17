import { ExpandableTextLines } from './expandable-text-lines.type';

/**
 * The values an expandable text uses when its inputs are not set.
 */
export type ExpandableTextConfig = {
    /**
     * How many lines show while it is closed.
     */
    lines: ExpandableTextLines,
    /**
     * The text of the button that opens it.
     */
    moreLabel: string,
    /**
     * The text of the button that closes it again.
     */
    lessLabel: string
};
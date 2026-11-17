import { MediaSplitAlign } from './media-split-align.type';
import { MediaSplitPosition } from './media-split-position.type';
import { MediaSplitWidth } from './media-split-width.type';

/**
 * The values a media split uses when its inputs are not set.
 */
export type MediaSplitConfig = {
    /**
     * On which side of the text the media stands.
     */
    position: MediaSplitPosition,
    /**
     * How much of the width the media takes.
     */
    mediaWidth: MediaSplitWidth,
    /**
     * How the media and the text line up.
     */
    align: MediaSplitAlign
};
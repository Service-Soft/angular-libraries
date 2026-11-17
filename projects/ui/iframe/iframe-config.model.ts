/**
 * The values an iframe uses when its inputs are not set.
 */
export type IframeConfig = {
    /**
     * The ratio of its width to its height, like '16 / 9', or undefined to fill the height of its parent.
     */
    aspectRatio: string | undefined
};
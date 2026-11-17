/**
 * A pair of color tokens that is shown on top of each other, and the contrast it needs.
 */
export type ContrastRequirement = {
    /**
     * The token of the content, without the '--color-' prefix.
     */
    foreground: string,
    /**
     * The token of the area behind the content, without the '--color-' prefix.
     */
    background: string,
    /**
     * The minimal contrast ratio, eg. 4.5 for 4.5:1.
     */
    minimum: number
};
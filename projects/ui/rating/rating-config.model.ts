/**
 * The values a rating uses when its inputs are not set, and its texts.
 */
export type RatingConfig = {
    /**
     * How many stars there are, which a value of max fills.
     */
    max: number,
    /**
     * What screen readers read for the stars, like '4.4 out of 5 stars'.
     * @param value - The value, written in the language of the app with one decimal, like '4.4'.
     * @param max - How many stars there are.
     * @returns The text.
     */
    label: (value: string, max: number) => string
};
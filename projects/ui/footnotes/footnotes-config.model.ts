/**
 * The texts of footnotes, for screen readers.
 */
export type FootnotesConfig = {
    /**
     * The name of the list of footnotes.
     */
    label: string,
    /**
     * The name of a reference in the text, from its number, like 'Footnote 1'. It holds the number, which is what it
     * shows.
     */
    referenceLabel: (number: number) => string,
    /**
     * The name of the link of a footnote back to its reference, from its number, like 'Back to reference 1'.
     */
    backLabel: (number: number) => string
};
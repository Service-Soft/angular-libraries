/**
 * A chosen value of a chips input, as its chip shows it.
 */
export type InputChipView<T> = {
    /**
     * The value.
     */
    value: T,
    /**
     * What the chip shows: the label of its option, or the text it was typed as.
     */
    label: string,
    /**
     * The id of its label, which describes the button that removes it.
     */
    labelId: string
};
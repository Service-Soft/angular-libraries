/**
 * A member of an enum, with the text that names it.
 */
export type EnumMember = {
    /**
     * The text, like the value of a string enum.
     */
    label: string,
    /**
     * The value.
     */
    value: string | number
};
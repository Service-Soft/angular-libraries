/**
 * One of the options of a select or an autocomplete.
 */
export type InputOption<T> = {
    /**
     * What the option shows.
     */
    label: string,
    /**
     * The value the input takes when the option is chosen. Compared by identity.
     */
    value: T,
    /**
     * Whether the option can't be chosen.
     */
    disabled?: boolean
};
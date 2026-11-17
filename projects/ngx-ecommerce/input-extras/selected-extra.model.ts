/**
 * An extra that is chosen, with how many of it.
 */
export type SelectedExtra = {
    /**
     * The id of its option.
     */
    id: string,
    /**
     * How many of it, 1 for a toggle.
     */
    quantity: number
};
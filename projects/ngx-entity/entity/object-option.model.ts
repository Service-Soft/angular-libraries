/**
 * One of the fixed objects the select of an object property offers.
 */
export type ObjectOption<O> = {
    /**
     * What the option shows, like 'Head office'.
     */
    label: string,
    /**
     * The object the property takes when the option is chosen. A value equal to it, like a copy from the server, shows
     * it as chosen.
     */
    value: O
};
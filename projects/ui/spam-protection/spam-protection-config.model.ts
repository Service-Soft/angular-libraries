/**
 * The values a spam protection uses when its inputs are not set, and its texts.
 */
export type SpamProtectionConfig = {
    /**
     * The name of the hidden field, one a bot expects in a form and fills in, like 'website'.
     */
    name: string,
    /**
     * The label of the hidden field, for whoever reaches it anyway.
     */
    label: string,
    /**
     * How many milliseconds a person needs at least to fill in the form, 0 for no minimum.
     */
    minimumFillTime: number
};
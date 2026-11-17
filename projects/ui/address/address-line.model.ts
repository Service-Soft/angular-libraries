/**
 * A line of an address block, like the country.
 */
export type AddressLine = {
    /**
     * The schema.org property it is, like 'addressCountry'.
     */
    itemprop: string,
    /**
     * The text of the line.
     */
    text: string
};
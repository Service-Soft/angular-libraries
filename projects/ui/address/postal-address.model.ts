/**
 * Where a business or a person can be found, as an address block shows it.
 */
export type PostalAddress = {
    /**
     * The street and the house number, like 'Main Street 1'.
     */
    street: string,
    /**
     * The postal code, like '50999'.
     */
    postalCode: string,
    /**
     * The city, like 'Cologne'.
     */
    city: string,
    /**
     * The region or state, like 'NRW', where an address needs one.
     */
    region?: string,
    /**
     * The country, like 'Germany'. Leave it out where everybody knows it.
     */
    country?: string
};
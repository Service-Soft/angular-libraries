/**
 * The values an address block uses when its inputs are not set, and its texts.
 */
export type AddressConfig = {
    /**
     * Whether the phone number, the fax number and the email address show an icon instead of their label.
     */
    icons: boolean,
    /**
     * Whether the address is marked up with schema.org microdata, which search engines read.
     */
    microdata: boolean,
    /**
     * The schema.org type of the business the address belongs to, like 'LocalBusiness', 'Dentist' or 'SportsClub', or
     * undefined to add the name, the address and the contacts to an item of your own around it.
     */
    businessType: string | undefined,
    /**
     * What the phone number is, shown before it or read for its icon.
     */
    phoneLabel: string,
    /**
     * What the fax number is, shown before it or read for its icon.
     */
    faxLabel: string,
    /**
     * What the email address is, shown before it or read for its icon.
     */
    emailLabel: string
};
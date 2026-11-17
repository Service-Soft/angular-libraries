import { IconDefinition } from '@service-soft/ui/icon';

/**
 * A way to reach someone, as a row of an address block shows it.
 */
export type AddressContact = {
    /**
     * What it is, like 'Phone', shown before it or read for its icon.
     */
    label: string,
    /**
     * The icon that stands for the label.
     */
    icon: IconDefinition,
    /**
     * The number or address as it shows.
     */
    text: string,
    /**
     * Where its link leads, like 'tel:+4922341234', or undefined for one that can't be followed, like a fax number.
     */
    href: string | undefined,
    /**
     * The schema.org property it is, like 'telephone'.
     */
    itemprop: string
};
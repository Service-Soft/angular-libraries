/**
 * A line of an order, like a product or a night of a booking.
 */
export type OrderSummaryItem = {
    /**
     * What it is, like 'Double room'.
     */
    label: string,
    /**
     * More about it, shown below the label in the detailed variant, like the dates of a booking.
     */
    description?: string,
    /**
     * How many of it are ordered, like 3 nights. Can have a fraction, like 1.5 hours; the line total is then rounded to
     * a whole minor unit.
     */
    quantity: number,
    /**
     * The price of one, in the minor unit of the currency, like 8900 for 89.00 €. Gross or net, as the taxMode of the
     * summary says.
     */
    unitPrice: number,
    /**
     * The tax rate in percent, like 19 or 7. The default is the taxRate of the summary; without either, the item isn't
     * taxed.
     */
    taxRate?: number
};
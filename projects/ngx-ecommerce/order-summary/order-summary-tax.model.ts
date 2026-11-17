/**
 * The tax of one rate of an order.
 */
export type OrderSummaryTax = {
    /**
     * The rate in percent, like 19.
     */
    rate: number,
    /**
     * The net amount of the items of this rate after discounts, which the tax is calculated from, in the minor unit.
     */
    net: number,
    /**
     * The tax, in the minor unit.
     */
    amount: number
};
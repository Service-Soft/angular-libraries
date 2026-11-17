import { OrderSummaryTax } from './order-summary-tax.model';

/**
 * The amounts of an order, every one in the minor unit of its currency.
 */
export type OrderSummaryTotals = {
    /**
     * The total of each item, its quantity times its unit price, in the order of the items.
     */
    lines: number[],
    /**
     * The sum of the lines.
     */
    subtotal: number,
    /**
     * What each discount takes off, in the order of the discounts.
     */
    discounts: number[],
    /**
     * The tax of each rate, in the order the rates first appear in the items. Items without a rate have none.
     */
    taxes: OrderSummaryTax[],
    /**
     * The total without taxes, after discounts.
     */
    net: number,
    /**
     * What the customer pays: the total with taxes, after discounts.
     */
    total: number
};
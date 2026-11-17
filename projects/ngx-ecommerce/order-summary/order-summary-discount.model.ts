import { OrderSummaryDiscountType } from './order-summary-discount-type.type';

/**
 * A discount on the whole order, like a voucher or a members' discount.
 */
export type OrderSummaryDiscount = {
    /**
     * What it is, like 'Voucher SUMMER' or 'Members 10 %'.
     */
    label: string,
    /**
     * Whether the value is an amount or a percentage of the subtotal.
     */
    type: OrderSummaryDiscountType,
    /**
     * The amount in the minor unit of the currency, like 500 for 5.00 €, or the percentage, like 10. Gross or net, as
     * the taxMode of the summary says.
     */
    value: number
};
/**
 * How much an order summary shows: compact, each item with its quantity and total, like in the sidebar of a checkout;
 * detailed, a column each for the quantity and the unit price, the descriptions of the items and the net total.
 */
export type OrderSummaryVariant = 'compact' | 'detailed';
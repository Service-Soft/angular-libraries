/**
 * Whether the prices of an order include the tax, like the gross prices shops show consumers, which then says how much
 * tax they include, or are net prices, which the tax is added to, like for businesses.
 */
export type OrderSummaryTaxMode = 'gross' | 'net';
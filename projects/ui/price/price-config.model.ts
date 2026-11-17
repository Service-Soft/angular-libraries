import { PriceSize } from './price-size.type';

/**
 * The values a price uses when its inputs are not set.
 */
export type PriceConfig = {
    /**
     * The currency, as an ISO 4217 code like 'EUR'.
     */
    currency: string,
    /**
     * How the amounts are written, on top of the currency, like `{ maximumFractionDigits: 0 }`.
     */
    format: Intl.NumberFormatOptions,
    /**
     * How large the amount is.
     */
    size: PriceSize,
    /**
     * What screen readers read in place of the slash before the period, like 'per' in 'per month'.
     */
    perLabel: string,
    /**
     * What screen readers read before the old price, which they don't read as struck through.
     */
    oldPriceLabel: string
};
import { OrderSummaryTaxMode } from './order-summary-tax-mode.type';
import { OrderSummaryVariant } from './order-summary-variant.type';

/**
 * The texts of an order summary.
 */
export type OrderSummaryLabels = {
    /**
     * The name of the table for screen readers.
     */
    caption: string,
    /**
     * The heading of the column of the items.
     */
    item: string,
    /**
     * The heading of the column of the quantities, in the detailed variant.
     */
    quantity: string,
    /**
     * The heading of the column of the unit prices, in the detailed variant.
     */
    unitPrice: string,
    /**
     * The heading of the column of the line totals.
     */
    amount: string,
    /**
     * The sum of the items, shown when discounts or taxes make the total differ from it.
     */
    subtotal: string,
    /**
     * The total without taxes, in the detailed variant.
     */
    netTotal: string,
    /**
     * The tax that is added to net prices, followed by its rate, like 'VAT 19%'.
     */
    tax: string,
    /**
     * The tax that gross prices include, followed by its rate, like 'Includes VAT 19%'.
     */
    includedTax: string,
    /**
     * What the customer pays.
     */
    total: string
};

/**
 * The values an order summary uses when its inputs are not set.
 */
export type OrderSummaryConfig = {
    /**
     * How much the summary shows.
     */
    variant: OrderSummaryVariant,
    /**
     * Whether the prices include the tax (gross) or the tax is added to them (net).
     */
    taxMode: OrderSummaryTaxMode,
    /**
     * The tax rate in percent of items that don't have their own, like 19, or undefined for none.
     */
    taxRate: number | undefined,
    /**
     * The texts of the summary.
     */
    labels: OrderSummaryLabels
};
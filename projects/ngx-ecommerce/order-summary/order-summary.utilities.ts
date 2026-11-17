import { MoneyUtilities } from '@service-soft/ngx-ecommerce/money';

import { OrderSummaryDiscount } from './order-summary-discount.model';
import { OrderSummaryItem } from './order-summary-item.model';
import { OrderSummaryTaxMode } from './order-summary-tax-mode.type';
import { OrderSummaryTax } from './order-summary-tax.model';
import { OrderSummaryTotals } from './order-summary-totals.model';

/**
 * The amount of the items of one tax rate.
 */
type RateAmount = {
    /**
     * The rate in percent, undefined for items that aren't taxed.
     */
    rate: number | undefined,
    /**
     * The sum of the lines of the rate, in the minor unit.
     */
    amount: number
};

/**
 * Calculates the amounts of an order the way an invoice does, so the summary matches what is charged.
 */
export abstract class OrderSummaryUtilities {
    /**
     * Calculates the totals of an order. Every amount is in the minor unit of the currency, and every step is rounded
     * to a whole one, half away from zero: each line, each percentage discount and each tax. The tax is calculated
     * from the sum of each rate, not per line, like on an invoice, and discounts reduce every rate by its share of the
     * subtotal, so a discount on mixed rates lowers each tax accordingly.
     * @param items - The items of the order.
     * @param discounts - The discounts on the whole order. A percentage is taken of the subtotal, every one of the same.
     * @param taxMode - Whether the prices include the tax (gross) or the tax is added to them (net).
     * @param taxRate - The rate in percent of items that don't have their own, or undefined for none.
     * @returns The totals of the lines, the subtotal, the discounts, the taxes per rate, the net total and the total.
     */
    static calculateTotals(
        items: OrderSummaryItem[],
        discounts: OrderSummaryDiscount[],
        taxMode: OrderSummaryTaxMode,
        taxRate: number | undefined
    ): OrderSummaryTotals {
        const lines: number[] = items.map(item => MoneyUtilities.round(item.quantity * item.unitPrice));
        const subtotal: number = this.sum(lines);
        const discountAmounts: number[] = discounts.map(
            discount => discount.type === 'amount' ? discount.value : this.calculatePercentage(subtotal, discount.value)
        );
        const discounted: number = subtotal - this.sum(discountAmounts);

        const rates: RateAmount[] = this.groupByRate(items, lines, taxRate);
        const shares: number[] = this.allocate(this.sum(discountAmounts), rates.map(rate => rate.amount));
        const taxes: OrderSummaryTax[] = rates.flatMap((rate, index) => rate.rate == undefined
            ? []
            : [this.calculateTax(rate.amount - (shares[index] ?? 0), rate.rate, taxMode)]);
        const taxTotal: number = this.sum(taxes.map(tax => tax.amount));

        return taxMode === 'gross'
            ? { lines, subtotal, discounts: discountAmounts, taxes, net: discounted - taxTotal, total: discounted }
            : { lines, subtotal, discounts: discountAmounts, taxes, net: discounted, total: discounted + taxTotal };
    }

    private static calculateTax(amount: number, rate: number, taxMode: OrderSummaryTaxMode): OrderSummaryTax {
        // in hundredths of a percent, which makes rates like 7.7 % an integer, so only the last division can be inexact.
        const basisPoints: number = Math.round(rate * 100);
        if (taxMode === 'gross') {
            // what a gross amount includes: 119 € at 19 % include 119 × 19 / 119 = 19 €.
            const tax: number = MoneyUtilities.round(amount * basisPoints / (10000 + basisPoints));
            return { rate, net: amount - tax, amount: tax };
        }
        return { rate, net: amount, amount: this.calculatePercentage(amount, rate) };
    }

    private static calculatePercentage(amount: number, percentage: number): number {
        return MoneyUtilities.round(amount * Math.round(percentage * 100) / 10000);
    }

    // in the order the rates first appear, which is the order an invoice lists them in.
    private static groupByRate(items: OrderSummaryItem[], lines: number[], taxRate: number | undefined): RateAmount[] {
        const rates: Map<number | undefined, number> = new Map();
        for (const [index, item] of items.entries()) {
            const rate: number | undefined = item.taxRate ?? taxRate;
            rates.set(rate, (rates.get(rate) ?? 0) + (lines[index] ?? 0));
        }
        return [...rates].map(([rate, amount]) => ({ rate, amount }));
    }

    /**
     * Splits an amount into whole shares in proportion to the weights, which add up to exactly the amount.
     * @param amount - The amount to split, in the minor unit.
     * @param weights - What each share is in proportion to.
     * @returns The shares, in the order of the weights.
     */
    // rounding each share on its own can make them a cent more or less than the amount, so they are cut off first and
    // the cents left over go to the shares that lost the most (largest remainder).
    private static allocate(amount: number, weights: number[]): number[] {
        const total: number = this.sum(weights);
        if (total === 0) {
            // nothing to be in proportion to, like a voucher on free items: the first share takes all of it.
            return weights.map((weight, index) => index === 0 ? amount : 0);
        }
        const exact: number[] = weights.map(weight => amount * weight / total);
        const shares: number[] = exact.map(share => Math.trunc(share));
        const losses: number[] = exact.map((share, index) => Math.abs(share - (shares[index] ?? 0)));
        let rest: number = amount - this.sum(shares);
        // map makes a new array, which sort may change.
        const byLoss: number[] = losses.map((loss, index) => index).sort((a, b) => (losses[b] ?? 0) - (losses[a] ?? 0));
        for (const index of byLoss) {
            if (rest === 0) {
                break;
            }
            const step: number = Math.sign(rest);
            shares[index] = (shares[index] ?? 0) + step;
            rest -= step;
        }
        return shares;
    }

    private static sum(amounts: number[]): number {
        return amounts.reduce((sum, amount) => sum + amount, 0);
    }
}
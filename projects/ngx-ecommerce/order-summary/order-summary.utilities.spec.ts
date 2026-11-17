import { describe, expect, test } from 'vitest';

import { OrderSummaryItem } from './order-summary-item.model';
import { OrderSummaryTotals } from './order-summary-totals.model';
import { OrderSummaryUtilities } from './order-summary.utilities';

// a booking in Germany: the room has the reduced rate, the breakfast the standard one.
const BOOKING: OrderSummaryItem[] = [
    { label: 'Double room', quantity: 2, unitPrice: 8900, taxRate: 7 },
    { label: 'Breakfast', quantity: 2, unitPrice: 1500, taxRate: 19 }
];

describe('OrderSummaryUtilities', () => {
    test('says how much tax gross prices include, per rate, rounded once per rate', () => {
        const totals: OrderSummaryTotals = OrderSummaryUtilities.calculateTotals(BOOKING, [], 'gross', undefined);

        expect(totals.lines).toEqual([17800, 3000]);
        expect(totals.subtotal).toBe(20800);
        // 17800 × 7 / 107 = 1164.49 and 3000 × 19 / 119 = 478.99
        expect(totals.taxes).toEqual([
            { rate: 7, net: 16636, amount: 1164 },
            { rate: 19, net: 2521, amount: 479 }
        ]);
        expect(totals.total).toBe(20800);
        expect(totals.net).toBe(20800 - 1164 - 479);
    });

    test('adds the tax to net prices, after a percentage discount of the subtotal', () => {
        const totals: OrderSummaryTotals = OrderSummaryUtilities.calculateTotals(
            [{ label: 'Consulting', quantity: 1.5, unitPrice: 6667 }],
            [{ label: 'Members', type: 'percentage', value: 10 }],
            'net',
            19
        );

        // 1.5 × 6667 = 10000.5, rounded half away from zero
        expect(totals.lines).toEqual([10001]);
        expect(totals.discounts).toEqual([1000]);
        expect(totals.net).toBe(9001);
        // 9001 × 19 % = 1710.19
        expect(totals.taxes).toEqual([{ rate: 19, net: 9001, amount: 1710 }]);
        expect(totals.total).toBe(10711);
    });

    test('splits a discount on mixed rates by their share of the subtotal, without losing a cent', () => {
        const totals: OrderSummaryTotals = OrderSummaryUtilities.calculateTotals(
            [
                { label: 'Book', quantity: 1, unitPrice: 2000, taxRate: 7 },
                { label: 'Pen', quantity: 1, unitPrice: 1000, taxRate: 19 }
            ],
            [{ label: 'Voucher', type: 'amount', value: 100 }],
            'gross',
            undefined
        );

        // 66.67 and 33.33 cents of the voucher: the book's share lost more by cutting it off, so it gets the cent left
        // over. The book is then 1933, the pen 967.
        expect(totals.taxes).toEqual([
            { rate: 7, net: 1933 - 126, amount: 126 },
            { rate: 19, net: 967 - 154, amount: 154 }
        ]);
        expect(totals.total).toBe(2900);
    });

    test('taxes nothing without a rate', () => {
        const totals: OrderSummaryTotals = OrderSummaryUtilities.calculateTotals(
            [{ label: 'Gift card', quantity: 2, unitPrice: 2500 }],
            [],
            'net',
            undefined
        );

        expect(totals.taxes).toEqual([]);
        expect(totals.net).toBe(5000);
        expect(totals.total).toBe(5000);
    });
});
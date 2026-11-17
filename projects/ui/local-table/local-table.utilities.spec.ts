import { describe, expect, test } from 'vitest';

import { LocalTableColumn } from './local-table-column.model';
import { LocalTableUtilities } from './local-table.utilities';

type Order = {
    number: string,
    customer: string,
    date: Date,
    paid: boolean
};

const FIRST: Order = { number: 'A-9', customer: 'Ada', date: new Date(2026, 0, 5), paid: true };
const SECOND: Order = { number: 'A-10', customer: 'ALAN', date: new Date(2025, 11, 24), paid: false };
const THIRD: Order = { number: 'A-2', customer: 'Grace', date: new Date(2026, 1, 1), paid: true };
const ORDERS: Order[] = [FIRST, SECOND, THIRD];

const COLUMNS: LocalTableColumn<Order>[] = [
    { key: 'number', label: 'Number', value: order => order.number, filter: { type: 'text' } },
    { key: 'customer', label: 'Customer', value: order => order.customer, filter: { type: 'text' } },
    {
        key: 'date',
        label: 'Date',
        value: order => order.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        compare: (a, b) => a.date.getTime() - b.date.getTime()
    },
    {
        key: 'paid',
        label: 'Paid',
        value: order => order.paid ? 'Yes' : 'No',
        filter: { type: 'select', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] }
    }
];

describe('LocalTableUtilities', () => {
    test('finds the rows whose text contains a text filter, ignoring case', () => {
        expect(LocalTableUtilities.findMatchingRows(ORDERS, COLUMNS, { customer: 'A' })).toEqual([FIRST, SECOND, THIRD]);
        expect(LocalTableUtilities.findMatchingRows(ORDERS, COLUMNS, { customer: 'al' })).toEqual([SECOND]);
    });

    test('finds the rows whose text is the label of the option of a select filter', () => {
        expect(LocalTableUtilities.findMatchingRows(ORDERS, COLUMNS, { paid: false })).toEqual([SECOND]);
    });

    test('finds the rows that pass every filter, and ignores a filter of a column it doesn\'t have', () => {
        expect(LocalTableUtilities.findMatchingRows(ORDERS, COLUMNS, { customer: 'a', paid: true, removed: 'x' })).toEqual([FIRST, THIRD]);
    });

    test('finds the rows a column matches itself', () => {
        const columns: LocalTableColumn<Order>[] = [{ key: 'year', label: 'Year', value: order => String(order.date.getFullYear()), matches: (order, year) => order.date.getFullYear() === year }];

        expect(LocalTableUtilities.findMatchingRows(ORDERS, columns, { year: 2025 })).toEqual([SECOND]);
    });

    test('orders by the texts of a column, numbers in them as numbers', () => {
        expect(LocalTableUtilities.resolveOrderedRows(ORDERS, COLUMNS, { key: 'number', direction: 'ASC' })).toEqual([THIRD, FIRST, SECOND]);
        expect(LocalTableUtilities.resolveOrderedRows(ORDERS, COLUMNS, { key: 'number', direction: 'DESC' })).toEqual([SECOND, FIRST, THIRD]);
    });

    test('orders by the compare of a column, like dates whose text doesn\'t order', () => {
        expect(LocalTableUtilities.resolveOrderedRows(ORDERS, COLUMNS, { key: 'date', direction: 'ASC' })).toEqual([SECOND, FIRST, THIRD]);
    });

    test('leaves the rows as they are without an order, and never changes the array it gets', () => {
        const rows: Order[] = [...ORDERS];

        expect(LocalTableUtilities.resolveOrderedRows(rows, COLUMNS, undefined)).toEqual(ORDERS);
        LocalTableUtilities.resolveOrderedRows(rows, COLUMNS, { key: 'number', direction: 'ASC' });
        expect(rows).toEqual(ORDERS);
    });
});
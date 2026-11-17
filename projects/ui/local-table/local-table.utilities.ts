import { InputOption } from '@service-soft/ui/input';
import { TableFilters, TableOrder } from '@service-soft/ui/table';

import { LocalTableColumn } from './local-table-column.model';

// numbers in a text are compared as numbers, so 9 comes before 10.
const COLLATOR: Intl.Collator = new Intl.Collator(undefined, { numeric: true });

/**
 * Filters and orders the rows of ui-local-table, which has all of them.
 */
export abstract class LocalTableUtilities {
    /**
     * Finds the rows that pass every filter. A filter of a column that doesn't exist filters nothing.
     * @param rows - All rows.
     * @param columns - The columns.
     * @param filters - The filters, by the key of their column.
     * @returns The rows that pass, in their order.
     */
    static findMatchingRows<T>(rows: T[], columns: LocalTableColumn<T>[], filters: TableFilters): T[] {
        const filtered: LocalTableColumn<T>[] = columns.filter(column => filters[column.key] != undefined);
        return rows.filter(row => filtered.every(column => this.validateMatch(row, column, filters[column.key])));
    }

    /**
     * Resolves the rows in an order. An order by a column that doesn't exist leaves them as they are.
     * @param rows - The rows.
     * @param columns - The columns.
     * @param order - The order, if any.
     * @returns The ordered rows, a new array.
     */
    static resolveOrderedRows<T>(rows: T[], columns: LocalTableColumn<T>[], order: TableOrder | undefined): T[] {
        const column: LocalTableColumn<T> | undefined = columns.find(candidate => candidate.key === order?.key);
        if (column == undefined) {
            return [...rows];
        }
        const compare: (a: T, b: T) => number = column.compare ?? ((a, b) => COLLATOR.compare(column.value(a), column.value(b)));
        const direction: number = order?.direction === 'DESC' ? -1 : 1;
        return [...rows].sort((a, b) => direction * compare(a, b));
    }

    private static validateMatch<T>(row: T, column: LocalTableColumn<T>, filter: unknown): boolean {
        if (column.matches != undefined) {
            return column.matches(row, filter);
        }
        const text: string = column.value(row);
        if (column.filter?.type === 'select') {
            const option: InputOption<unknown> | undefined = column.filter.options.find(candidate => candidate.value === filter);
            return option == undefined || option.label === text;
        }
        return typeof filter !== 'string' || text.toLocaleLowerCase().includes(filter.toLocaleLowerCase());
    }
}
import { inject, InjectionToken, Provider } from '@angular/core';

import { TableConfig } from './table-config.model';

const DEFAULT_TABLE_CONFIG: TableConfig = {
    pageSize: 10,
    pageSizes: [10, 25, 50, 100],
    variant: 'outlined',
    striped: false,
    selectAllLabel: 'Select all rows of this page',
    selectRowLabel: 'Select',
    filterLabel: column => `Filter ${column}`,
    allLabel: 'All',
    filtersLabel: 'Filters',
    removeFilterLabel: filter => `Remove filter ${filter}`,
    paginationLabel: table => `Pages of ${table}`,
    rangeLabel: (first, last, total) => `Showing ${first}–${last} of ${total}`,
    pageSizeLabel: 'Rows per page',
    actionsLabel: 'Actions',
    noRowsLabel: 'Nothing found.',
    loadingLabel: 'Loading'
};

/**
 * The values every table below this injector uses when its inputs are not set, and its texts.
 * Change them with provideTableConfig.
 */
export const TABLE_CONFIG: InjectionToken<TableConfig> = new InjectionToken<TableConfig>('TABLE_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_TABLE_CONFIG
});

/**
 * Changes the values every table uses when its inputs are not set, like the texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for TABLE_CONFIG.
 */
export function provideTableConfig(config: Partial<TableConfig>): Provider {
    return {
        provide: TABLE_CONFIG,
        useFactory: (): TableConfig => ({
            ...inject(TABLE_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_TABLE_CONFIG,
            ...config
        })
    };
}
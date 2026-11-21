import { inject, InjectionToken, Provider } from '@angular/core';

import { TableConfig } from './table-config.model';

/**
 * The values of a table when nothing changes them. Its texts are $localize, which an app translates like its own, and
 * resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultTableConfig(): TableConfig {
    return {
        pageSize: 10,
        pageSizes: [10, 25, 50, 100],
        variant: 'outlined',
        striped: false,
        selectAllLabel: $localize`:@@ui.table.selectAllLabel:Select all rows of this page`,
        selectRowLabel: $localize`:@@ui.table.selectRowLabel:Select`,
        filterLabel: column => $localize`:@@ui.table.filterLabel:Filter ${column}:column:`,
        allLabel: $localize`:@@ui.table.allLabel:All`,
        filtersLabel: $localize`:@@ui.table.filtersLabel:Filters`,
        removeFilterLabel: filter => $localize`:@@ui.table.removeFilterLabel:Remove filter ${filter}:filter:`,
        paginationLabel: table => $localize`:@@ui.table.paginationLabel:Pages of ${table}:table:`,
        rangeLabel: (first, last, total) => $localize`:@@ui.table.rangeLabel:Showing ${first}:first:–${last}:last: of ${total}:total:`,
        pageSizeLabel: $localize`:@@ui.table.pageSizeLabel:Rows per page`,
        actionsLabel: $localize`:@@ui.table.actionsLabel:Actions`,
        noRowsLabel: $localize`:@@ui.table.noRowsLabel:Nothing found.`,
        loadingLabel: $localize`:@@ui.table.loadingLabel:Loading`
    };
}

/**
 * The values every table below this injector uses when its inputs are not set, and its texts.
 * Change them with provideTableConfig.
 */
export const TABLE_CONFIG: InjectionToken<TableConfig> = new InjectionToken<TableConfig>('TABLE_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultTableConfig()
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
            ...inject(TABLE_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultTableConfig(),
            ...config
        })
    };
}
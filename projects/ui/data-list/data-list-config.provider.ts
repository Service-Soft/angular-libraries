import { inject, InjectionToken, Provider } from '@angular/core';

import { DataListConfig } from './data-list-config.model';

const DEFAULT_DATA_LIST_CONFIG: DataListConfig = {
    dateFormat: { dateStyle: 'medium' },
    numberFormat: {}
};

/**
 * The formats every data list below this injector uses for the items that don't set their own.
 * Change them with provideDataListConfig.
 */
export const DATA_LIST_CONFIG: InjectionToken<DataListConfig> = new InjectionToken<DataListConfig>('DATA_LIST_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_DATA_LIST_CONFIG
});

/**
 * Changes the formats data lists use for the items that don't set their own.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for DATA_LIST_CONFIG.
 */
export function provideDataListConfig(config: Partial<DataListConfig>): Provider {
    return {
        provide: DATA_LIST_CONFIG,
        useFactory: (): DataListConfig => ({
            ...inject(DATA_LIST_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_DATA_LIST_CONFIG,
            ...config
        })
    };
}
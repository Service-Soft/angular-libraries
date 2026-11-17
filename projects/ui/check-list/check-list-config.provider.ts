import { inject, InjectionToken, Provider } from '@angular/core';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

import { CheckListConfig } from './check-list-config.model';

const DEFAULT_CHECK_LIST_CONFIG: CheckListConfig = {
    color: 'primary',
    icon: faCheck,
    excludedIcon: faXmark,
    excludedLabel: 'not included'
};

/**
 * The values every check list below this injector uses when its inputs are not set.
 * Change them with provideCheckListConfig.
 */
export const CHECK_LIST_CONFIG: InjectionToken<CheckListConfig> = new InjectionToken<CheckListConfig>('CHECK_LIST_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_CHECK_LIST_CONFIG
});

/**
 * Changes the values check lists use when their inputs are not set, like the text screen readers read for an item that
 * is not included.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for CHECK_LIST_CONFIG.
 */
export function provideCheckListConfig(config: Partial<CheckListConfig>): Provider {
    return {
        provide: CHECK_LIST_CONFIG,
        useFactory: (): CheckListConfig => ({
            ...inject(CHECK_LIST_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_CHECK_LIST_CONFIG,
            ...config
        })
    };
}
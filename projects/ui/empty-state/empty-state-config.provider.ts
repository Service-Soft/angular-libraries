import { inject, InjectionToken, Provider } from '@angular/core';
import { faInbox, faMagnifyingGlass, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { EmptyStateConfig } from './empty-state-config.model';

// no heading by default: inside a table or a list, a heading would break the outline of the page. A page whose content
// is the empty state gives it a level.
const DEFAULT_EMPTY_STATE_CONFIG: EmptyStateConfig = {
    variant: 'empty',
    size: 'md',
    headingLevel: undefined,
    icons: {
        empty: faInbox,
        'no-results': faMagnifyingGlass,
        error: faTriangleExclamation
    }
};

/**
 * The values every empty state below this injector uses when its inputs are not set.
 * Change them with provideEmptyStateConfig.
 */
export const EMPTY_STATE_CONFIG: InjectionToken<EmptyStateConfig> = new InjectionToken<EmptyStateConfig>('EMPTY_STATE_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_EMPTY_STATE_CONFIG
});

/**
 * Changes the values empty states use when their inputs are not set, like the icons of the variants.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for EMPTY_STATE_CONFIG.
 */
export function provideEmptyStateConfig(config: Partial<EmptyStateConfig>): Provider {
    return {
        provide: EMPTY_STATE_CONFIG,
        useFactory: (): EmptyStateConfig => ({
            ...inject(EMPTY_STATE_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_EMPTY_STATE_CONFIG,
            ...config
        })
    };
}
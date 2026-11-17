import { inject, InjectionToken, Provider } from '@angular/core';

import { TableOfContentsConfig } from './table-of-contents-config.model';

// the label of the anchors of @service-soft/ngx-navigation, which link to the sections of a page as well.
const DEFAULT_TABLE_OF_CONTENTS_CONFIG: TableOfContentsConfig = {
    label: 'On this page',
    levels: [2, 3],
    spy: true
};

/**
 * The values every table of contents below this injector uses when its inputs are not set.
 * Change them with provideTableOfContentsConfig.
 */
export const TABLE_OF_CONTENTS_CONFIG: InjectionToken<TableOfContentsConfig> = new InjectionToken<TableOfContentsConfig>(
    'TABLE_OF_CONTENTS_CONFIG',
    {
        providedIn: 'root',
        factory: () => DEFAULT_TABLE_OF_CONTENTS_CONFIG
    }
);

/**
 * Changes the values tables of contents use when their inputs are not set, like the label to translate it.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for TABLE_OF_CONTENTS_CONFIG.
 */
export function provideTableOfContentsConfig(config: Partial<TableOfContentsConfig>): Provider {
    return {
        provide: TABLE_OF_CONTENTS_CONFIG,
        useFactory: (): TableOfContentsConfig => ({
            ...inject(TABLE_OF_CONTENTS_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_TABLE_OF_CONTENTS_CONFIG,
            ...config
        })
    };
}
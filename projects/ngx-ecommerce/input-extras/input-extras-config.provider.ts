import { inject, InjectionToken, Provider } from '@angular/core';

import { InputExtrasConfigChanges } from './input-extras-config-changes.model';
import { InputExtrasConfig } from './input-extras-config.model';

const DEFAULT_INPUT_EXTRAS_CONFIG: InputExtrasConfig = {
    appearance: 'checkbox',
    showTotal: false,
    labels: {
        units: {
            once: 'once',
            perItem: 'each',
            perDay: 'per day'
        },
        decrease: 'Remove one',
        increase: 'Add one',
        total: 'Extras'
    }
};

/**
 * The values every extras input below this injector uses when its inputs are not set.
 * Change them with provideInputExtrasConfig.
 */
export const INPUT_EXTRAS_CONFIG: InjectionToken<InputExtrasConfig> = new InjectionToken<InputExtrasConfig>('INPUT_EXTRAS_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_INPUT_EXTRAS_CONFIG
});

/**
 * Changes the values extras inputs use when their inputs are not set, like their texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector, including single labels and units.
 * @param config - The values to change.
 * @returns The provider for INPUT_EXTRAS_CONFIG.
 */
export function provideInputExtrasConfig(config: InputExtrasConfigChanges): Provider {
    return {
        provide: INPUT_EXTRAS_CONFIG,
        useFactory: (): InputExtrasConfig => {
            const parent: InputExtrasConfig = inject(INPUT_EXTRAS_CONFIG, { skipSelf: true, optional: true })
                ?? DEFAULT_INPUT_EXTRAS_CONFIG;
            return {
                ...parent,
                ...config,
                labels: { ...parent.labels, ...config.labels, units: { ...parent.labels.units, ...config.labels?.units } }
            };
        }
    };
}
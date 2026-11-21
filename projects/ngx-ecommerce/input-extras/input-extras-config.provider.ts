import { inject, InjectionToken, Provider } from '@angular/core';

import { InputExtrasConfigChanges } from './input-extras-config-changes.model';
import { InputExtrasConfig } from './input-extras-config.model';

/**
 * The values of an extras input when nothing changes them. Its texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultInputExtrasConfig(): InputExtrasConfig {
    return {
        appearance: 'checkbox',
        showTotal: false,
        labels: {
            units: {
                once: $localize`:@@ngx-ecommerce.input-extras.units.once:once`,
                perItem: $localize`:@@ngx-ecommerce.input-extras.units.perItem:each`,
                perDay: $localize`:@@ngx-ecommerce.input-extras.units.perDay:per day`
            },
            decrease: $localize`:@@ngx-ecommerce.input-extras.decrease:Remove one`,
            increase: $localize`:@@ngx-ecommerce.input-extras.increase:Add one`,
            total: $localize`:@@ngx-ecommerce.input-extras.total:Extras`
        }
    };
}

/**
 * The values every extras input below this injector uses when its inputs are not set.
 * Change them with provideInputExtrasConfig.
 */
export const INPUT_EXTRAS_CONFIG: InjectionToken<InputExtrasConfig> = new InjectionToken<InputExtrasConfig>('INPUT_EXTRAS_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultInputExtrasConfig()
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
                ?? getDefaultInputExtrasConfig();
            return {
                ...parent,
                ...config,
                labels: { ...parent.labels, ...config.labels, units: { ...parent.labels.units, ...config.labels?.units } }
            };
        }
    };
}
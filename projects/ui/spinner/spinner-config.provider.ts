import { inject, InjectionToken, Provider } from '@angular/core';

import { SpinnerConfig } from './spinner-config.model';

/**
 * The values of a spinner when nothing changes them. Its label is $localize, which an app translates like its own
 * texts, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultSpinnerConfig(): SpinnerConfig {
    return {
        label: $localize`:@@ui.spinner.label:Loading`,
        size: 'md'
    };
}

/**
 * The values every spinner below this injector uses when its inputs are not set.
 * Change them with provideSpinnerConfig.
 */
export const SPINNER_CONFIG: InjectionToken<SpinnerConfig> = new InjectionToken<SpinnerConfig>('SPINNER_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultSpinnerConfig()
});

/**
 * Changes the values spinners use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for SPINNER_CONFIG.
 */
export function provideSpinnerConfig(config: Partial<SpinnerConfig>): Provider {
    return {
        provide: SPINNER_CONFIG,
        useFactory: (): SpinnerConfig => ({
            ...inject(SPINNER_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultSpinnerConfig(),
            ...config
        })
    };
}
import { inject, InjectionToken, Provider } from '@angular/core';

import { SpinnerConfig } from './spinner-config.model';

const DEFAULT_SPINNER_CONFIG: SpinnerConfig = {
    label: 'Loading',
    size: 'md'
};

/**
 * The values every spinner below this injector uses when its inputs are not set.
 * Change them with provideSpinnerConfig.
 */
export const SPINNER_CONFIG: InjectionToken<SpinnerConfig> = new InjectionToken<SpinnerConfig>('SPINNER_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_SPINNER_CONFIG
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
            ...inject(SPINNER_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_SPINNER_CONFIG,
            ...config
        })
    };
}
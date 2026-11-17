import { inject, InjectionToken, Provider } from '@angular/core';

import { StepsConfig } from './steps-config.model';

const DEFAULT_STEPS_CONFIG: StepsConfig = {
    orientation: 'vertical'
};

/**
 * The values every list of steps below this injector uses when its inputs are not set.
 * Change them with provideStepsConfig.
 */
export const STEPS_CONFIG: InjectionToken<StepsConfig> = new InjectionToken<StepsConfig>('STEPS_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_STEPS_CONFIG
});

/**
 * Changes the values lists of steps use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for STEPS_CONFIG.
 */
export function provideStepsConfig(config: Partial<StepsConfig>): Provider {
    return {
        provide: STEPS_CONFIG,
        useFactory: (): StepsConfig => ({
            ...inject(STEPS_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_STEPS_CONFIG,
            ...config
        })
    };
}
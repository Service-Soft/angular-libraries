import { inject, InjectionToken, Provider } from '@angular/core';

import { StepperConfig } from './stepper-config.model';

const DEFAULT_STEPPER_CONFIG: StepperConfig = {
    orientation: 'horizontal',
    linear: true,
    color: 'primary',
    headingLevel: 2,
    label: 'Steps',
    backLabel: 'Back',
    nextLabel: 'Next',
    finishLabel: 'Finish',
    doneLabel: 'completed',
    busyLabel: 'Checking',
    progressLabel: (current, total) => `Step ${current} of ${total}`
};

/**
 * The values every stepper below this injector uses when its inputs are not set.
 * Change them with provideStepperConfig.
 */
export const STEPPER_CONFIG: InjectionToken<StepperConfig> = new InjectionToken<StepperConfig>('STEPPER_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_STEPPER_CONFIG
});

/**
 * Changes the values steppers use when their inputs are not set, like their texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for STEPPER_CONFIG.
 */
export function provideStepperConfig(config: Partial<StepperConfig>): Provider {
    return {
        provide: STEPPER_CONFIG,
        useFactory: (): StepperConfig => ({
            ...inject(STEPPER_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_STEPPER_CONFIG,
            ...config
        })
    };
}
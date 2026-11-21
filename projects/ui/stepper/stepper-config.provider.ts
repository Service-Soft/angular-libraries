import { inject, InjectionToken, Provider } from '@angular/core';

import { StepperConfig } from './stepper-config.model';

/**
 * The values of a stepper when nothing changes them. Its texts are $localize, which an app translates like its own, and
 * resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultStepperConfig(): StepperConfig {
    return {
        orientation: 'horizontal',
        linear: true,
        color: 'primary',
        headingLevel: 2,
        label: $localize`:@@ui.stepper.label:Steps`,
        backLabel: $localize`:@@ui.stepper.backLabel:Back`,
        nextLabel: $localize`:@@ui.stepper.nextLabel:Next`,
        finishLabel: $localize`:@@ui.stepper.finishLabel:Finish`,
        doneLabel: $localize`:@@ui.stepper.doneLabel:completed`,
        busyLabel: $localize`:@@ui.stepper.busyLabel:Checking`,
        progressLabel: (current, total) => $localize`:@@ui.stepper.progressLabel:Step ${current}:current: of ${total}:total:`
    };
}

/**
 * The values every stepper below this injector uses when its inputs are not set.
 * Change them with provideStepperConfig.
 */
export const STEPPER_CONFIG: InjectionToken<StepperConfig> = new InjectionToken<StepperConfig>('STEPPER_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultStepperConfig()
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
            ...inject(STEPPER_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultStepperConfig(),
            ...config
        })
    };
}
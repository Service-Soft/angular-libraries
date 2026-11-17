import { inject, InjectionToken, Provider } from '@angular/core';

import { InputTimeConfig } from './input-time-config.model';

const DEFAULT_INPUT_TIME_CONFIG: InputTimeConfig = {
    step: 30,
    // like the calendar of a date input
    color: 'primary',
    timePickerLabel: 'Choose a time'
};

/**
 * The values every time input below this injector uses when its inputs are not set, and its texts.
 * Change them with provideInputTimeConfig.
 */
export const INPUT_TIME_CONFIG: InjectionToken<InputTimeConfig> = new InjectionToken<InputTimeConfig>('INPUT_TIME_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_INPUT_TIME_CONFIG
});

/**
 * Changes the values time inputs use when their inputs are not set, like the texts to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for INPUT_TIME_CONFIG.
 */
export function provideInputTimeConfig(config: Partial<InputTimeConfig>): Provider {
    return {
        provide: INPUT_TIME_CONFIG,
        useFactory: (): InputTimeConfig => ({
            ...inject(INPUT_TIME_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_INPUT_TIME_CONFIG,
            ...config
        })
    };
}
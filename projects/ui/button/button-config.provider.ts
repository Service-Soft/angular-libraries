import { inject, InjectionToken, Provider } from '@angular/core';

import { ButtonConfig } from './button-config.model';

const DEFAULT_BUTTON_CONFIG: ButtonConfig = {
    variant: 'filled',
    color: 'primary',
    size: 'md',
    elevation: 0
};

/**
 * The values every button below this injector uses when its inputs are not set.
 * Change them with provideButtonConfig.
 */
export const BUTTON_CONFIG: InjectionToken<ButtonConfig> = new InjectionToken<ButtonConfig>('BUTTON_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_BUTTON_CONFIG
});

/**
 * Changes the values buttons use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for BUTTON_CONFIG.
 */
export function provideButtonConfig(config: Partial<ButtonConfig>): Provider {
    return {
        provide: BUTTON_CONFIG,
        useFactory: (): ButtonConfig => ({
            ...inject(BUTTON_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_BUTTON_CONFIG,
            ...config
        })
    };
}
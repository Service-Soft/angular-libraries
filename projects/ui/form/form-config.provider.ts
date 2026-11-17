import { inject, InjectionToken, Provider } from '@angular/core';

import { FormConfig } from './form-config.model';

const DEFAULT_FORM_CONFIG: FormConfig = {
    layout: 'block'
};

/**
 * The values every form below this injector uses when its inputs are not set.
 * Change them with provideFormConfig.
 */
export const FORM_CONFIG: InjectionToken<FormConfig> = new InjectionToken<FormConfig>('FORM_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_FORM_CONFIG
});

/**
 * Changes the values forms use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for FORM_CONFIG.
 */
export function provideFormConfig(config: Partial<FormConfig>): Provider {
    return {
        provide: FORM_CONFIG,
        useFactory: (): FormConfig => ({
            ...inject(FORM_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_FORM_CONFIG,
            ...config
        })
    };
}
import { InjectionToken, Provider } from '@angular/core';

import { SnackbarConfig } from './snackbar-config.model';

const DEFAULT_SNACKBAR_CONFIG: SnackbarConfig = {
    duration: 5000,
    color: 'neutral'
};

/**
 * How snackbars behave when SnackbarService.open gets no options. Change it with provideSnackbarConfig.
 */
export const SNACKBAR_CONFIG: InjectionToken<SnackbarConfig> = new InjectionToken<SnackbarConfig>('SNACKBAR_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_SNACKBAR_CONFIG
});

/**
 * Changes how snackbars behave when SnackbarService.open gets no options. Provide it in the application config: there
 * is one SnackbarService for the whole app.
 * @param config - The values to change.
 * @returns The provider for SNACKBAR_CONFIG.
 */
export function provideSnackbarConfig(config: Partial<SnackbarConfig>): Provider {
    // no merging with a parent injector: the service lives in the root injector and never sees a config further down.
    const snackbarConfig: SnackbarConfig = { ...DEFAULT_SNACKBAR_CONFIG, ...config };
    return { provide: SNACKBAR_CONFIG, useValue: snackbarConfig };
}
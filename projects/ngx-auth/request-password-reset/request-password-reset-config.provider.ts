import { inject, InjectionToken, Provider } from '@angular/core';

import { RequestPasswordResetConfigChanges } from './request-password-reset-config-changes.model';
import { RequestPasswordResetConfig } from './request-password-reset-config.model';

const DEFAULT_REQUEST_PASSWORD_RESET_CONFIG: RequestPasswordResetConfig = {
    labels: {
        title: 'Reset your password',
        message: 'Enter the email of your account, and we send you a link to choose a new password.',
        email: 'Email',
        send: 'Send link',
        sent: 'If an account belongs to this email, we sent it a link. It only works for a short time.',
        backToLogin: 'Back to the login',
        failed: 'Something went wrong. Please try again.'
    }
};

/**
 * What the page that sends a link to reset the password shows. Change it with provideRequestPasswordResetConfig.
 */
export const REQUEST_PASSWORD_RESET_CONFIG: InjectionToken<RequestPasswordResetConfig> = new InjectionToken<RequestPasswordResetConfig>(
    'REQUEST_PASSWORD_RESET_CONFIG',
    { providedIn: 'root', factory: () => DEFAULT_REQUEST_PASSWORD_RESET_CONFIG }
);

/**
 * Changes what the page that sends a link to reset the password shows, like its texts to translate them. Values you
 * leave out keep the ones of the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for REQUEST_PASSWORD_RESET_CONFIG.
 */
export function provideRequestPasswordResetConfig(config: RequestPasswordResetConfigChanges): Provider {
    return {
        provide: REQUEST_PASSWORD_RESET_CONFIG,
        useFactory: (): RequestPasswordResetConfig => {
            const parent: RequestPasswordResetConfig = inject(REQUEST_PASSWORD_RESET_CONFIG, { skipSelf: true, optional: true })
                ?? DEFAULT_REQUEST_PASSWORD_RESET_CONFIG;
            return { ...parent, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
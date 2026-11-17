import { inject, InjectionToken, Provider } from '@angular/core';

import { ConfirmPasswordResetConfigChanges } from './confirm-password-reset-config-changes.model';
import { ConfirmPasswordResetConfig } from './confirm-password-reset-config.model';

const DEFAULT_CONFIRM_PASSWORD_RESET_CONFIG: ConfirmPasswordResetConfig = {
    labels: {
        title: 'Choose a new password',
        newPassword: 'New password',
        save: 'Save password',
        invalid: 'This link doesn\'t work anymore. It ran out, or was used already.',
        requestNewLink: 'Get a new link',
        changed: 'Your password was changed. Log in with your new password.',
        login: 'Log in',
        failed: 'Something went wrong. Please try again.'
    },
    requestPasswordResetRoute: '/request-password-reset',
    newPasswordMinLength: undefined
};

/**
 * How the page that sets a new password with the link of a password reset looks and works. Change it with
 * provideConfirmPasswordResetConfig.
 */
export const CONFIRM_PASSWORD_RESET_CONFIG: InjectionToken<ConfirmPasswordResetConfig> = new InjectionToken<ConfirmPasswordResetConfig>(
    'CONFIRM_PASSWORD_RESET_CONFIG',
    { providedIn: 'root', factory: () => DEFAULT_CONFIRM_PASSWORD_RESET_CONFIG }
);

/**
 * Changes how the page that sets a new password with the link of a password reset looks and works, like its texts to
 * translate them. Values you leave out keep the ones of the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for CONFIRM_PASSWORD_RESET_CONFIG.
 */
export function provideConfirmPasswordResetConfig(config: ConfirmPasswordResetConfigChanges): Provider {
    return {
        provide: CONFIRM_PASSWORD_RESET_CONFIG,
        useFactory: (): ConfirmPasswordResetConfig => {
            const parent: ConfirmPasswordResetConfig = inject(CONFIRM_PASSWORD_RESET_CONFIG, { skipSelf: true, optional: true })
                ?? DEFAULT_CONFIRM_PASSWORD_RESET_CONFIG;
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
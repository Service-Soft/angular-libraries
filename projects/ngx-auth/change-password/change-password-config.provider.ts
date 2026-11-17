import { inject, InjectionToken, Provider } from '@angular/core';

import { ChangePasswordConfigChanges } from './change-password-config-changes.model';
import { ChangePasswordConfig } from './change-password-config.model';

const DEFAULT_CHANGE_PASSWORD_CONFIG: ChangePasswordConfig = {
    labels: {
        title: 'Change your password',
        currentPassword: 'Current password',
        newPassword: 'New password',
        save: 'Change password',
        changed: 'Your password was changed. Your other devices were logged out.',
        failed: 'Something went wrong. Please try again.'
    },
    newPasswordMinLength: undefined
};

/**
 * How the form that changes the password looks and works. Change it with provideChangePasswordConfig.
 */
export const CHANGE_PASSWORD_CONFIG: InjectionToken<ChangePasswordConfig> = new InjectionToken<ChangePasswordConfig>(
    'CHANGE_PASSWORD_CONFIG',
    { providedIn: 'root', factory: () => DEFAULT_CHANGE_PASSWORD_CONFIG }
);

/**
 * Changes how the form that changes the password looks and works, like its texts to translate them. Values you leave
 * out keep the ones of the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for CHANGE_PASSWORD_CONFIG.
 */
export function provideChangePasswordConfig(config: ChangePasswordConfigChanges): Provider {
    return {
        provide: CHANGE_PASSWORD_CONFIG,
        useFactory: (): ChangePasswordConfig => {
            const parent: ChangePasswordConfig = inject(CHANGE_PASSWORD_CONFIG, { skipSelf: true, optional: true })
                ?? DEFAULT_CHANGE_PASSWORD_CONFIG;
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
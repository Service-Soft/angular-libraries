import { inject, InjectionToken, Provider } from '@angular/core';

import { ChangePasswordConfigChanges } from './change-password-config-changes.model';
import { ChangePasswordConfig } from './change-password-config.model';

/**
 * How the form that changes the password looks and works when nothing changes it. Its texts are $localize, which an app
 * translates like its own, and resolved once the config is injected, so translations an app loads at runtime apply as
 * well.
 * @returns The default config.
 */
function getDefaultChangePasswordConfig(): ChangePasswordConfig {
    return {
        labels: {
            title: $localize`:@@ngx-auth.change-password.title:Change your password`,
            currentPassword: $localize`:@@ngx-auth.change-password.currentPassword:Current password`,
            newPassword: $localize`:@@ngx-auth.change-password.newPassword:New password`,
            save: $localize`:@@ngx-auth.change-password.save:Change password`,
            changed: $localize`:@@ngx-auth.change-password.changed:Your password was changed. Your other devices were logged out.`,
            failed: $localize`:@@ngx-auth.change-password.failed:Something went wrong. Please try again.`
        },
        newPasswordMinLength: undefined
    };
}

/**
 * How the form that changes the password looks and works. Change it with provideChangePasswordConfig.
 */
export const CHANGE_PASSWORD_CONFIG: InjectionToken<ChangePasswordConfig> = new InjectionToken<ChangePasswordConfig>(
    'CHANGE_PASSWORD_CONFIG',
    { providedIn: 'root', factory: () => getDefaultChangePasswordConfig() }
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
                ?? getDefaultChangePasswordConfig();
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
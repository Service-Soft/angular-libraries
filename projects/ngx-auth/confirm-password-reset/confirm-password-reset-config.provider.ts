import { inject, InjectionToken, Provider } from '@angular/core';

import { ConfirmPasswordResetConfigChanges } from './confirm-password-reset-config-changes.model';
import { ConfirmPasswordResetConfig } from './confirm-password-reset-config.model';

/**
 * How the page that sets a new password with the link of a password reset looks and works when nothing changes it. Its
 * texts are $localize, which an app translates like its own, and resolved once the config is injected, so translations
 * an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultConfirmPasswordResetConfig(): ConfirmPasswordResetConfig {
    return {
        labels: {
            title: $localize`:@@ngx-auth.confirm-password-reset.title:Choose a new password`,
            newPassword: $localize`:@@ngx-auth.confirm-password-reset.newPassword:New password`,
            save: $localize`:@@ngx-auth.confirm-password-reset.save:Save password`,
            invalid: $localize`:@@ngx-auth.confirm-password-reset.invalid:This link doesn't work anymore. It ran out, or was used already.`,
            requestNewLink: $localize`:@@ngx-auth.confirm-password-reset.requestNewLink:Get a new link`,
            changed: $localize`:@@ngx-auth.confirm-password-reset.changed:Your password was changed. Log in with your new password.`,
            login: $localize`:@@ngx-auth.confirm-password-reset.login:Log in`,
            failed: $localize`:@@ngx-auth.confirm-password-reset.failed:Something went wrong. Please try again.`
        },
        requestPasswordResetRoute: '/request-password-reset',
        newPasswordMinLength: undefined
    };
}

/**
 * How the page that sets a new password with the link of a password reset looks and works. Change it with
 * provideConfirmPasswordResetConfig.
 */
export const CONFIRM_PASSWORD_RESET_CONFIG: InjectionToken<ConfirmPasswordResetConfig> = new InjectionToken<ConfirmPasswordResetConfig>(
    'CONFIRM_PASSWORD_RESET_CONFIG',
    { providedIn: 'root', factory: () => getDefaultConfirmPasswordResetConfig() }
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
                ?? getDefaultConfirmPasswordResetConfig();
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
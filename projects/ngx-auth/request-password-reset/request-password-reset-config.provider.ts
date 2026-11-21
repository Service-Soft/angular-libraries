import { inject, InjectionToken, Provider } from '@angular/core';

import { RequestPasswordResetConfigChanges } from './request-password-reset-config-changes.model';
import { RequestPasswordResetConfig } from './request-password-reset-config.model';

/**
 * What the page that sends a link to reset the password shows when nothing changes it. Its texts are $localize, which
 * an app translates like its own, and resolved once the config is injected, so translations an app loads at runtime
 * apply as well.
 * @returns The default config.
 */
function getDefaultRequestPasswordResetConfig(): RequestPasswordResetConfig {
    return {
        labels: {
            title: $localize`:@@ngx-auth.request-password-reset.title:Reset your password`,
            message: $localize`:@@ngx-auth.request-password-reset.message:Enter the email of your account, and we send you a link to choose a new password.`,
            email: $localize`:@@ngx-auth.request-password-reset.email:Email`,
            send: $localize`:@@ngx-auth.request-password-reset.send:Send link`,
            sent: $localize`:@@ngx-auth.request-password-reset.sent:If an account belongs to this email, we sent it a link. It only works for a short time.`,
            backToLogin: $localize`:@@ngx-auth.request-password-reset.backToLogin:Back to the login`,
            failed: $localize`:@@ngx-auth.request-password-reset.failed:Something went wrong. Please try again.`
        }
    };
}

/**
 * What the page that sends a link to reset the password shows. Change it with provideRequestPasswordResetConfig.
 */
export const REQUEST_PASSWORD_RESET_CONFIG: InjectionToken<RequestPasswordResetConfig> = new InjectionToken<RequestPasswordResetConfig>(
    'REQUEST_PASSWORD_RESET_CONFIG',
    { providedIn: 'root', factory: () => getDefaultRequestPasswordResetConfig() }
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
                ?? getDefaultRequestPasswordResetConfig();
            return { ...parent, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
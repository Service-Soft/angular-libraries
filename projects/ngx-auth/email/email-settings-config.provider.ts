import { inject, InjectionToken, Provider } from '@angular/core';

import { EmailSettingsConfigChanges } from './email-settings-config-changes.model';
import { EmailSettingsConfig } from './email-settings-config.model';

const DEFAULT_EMAIL_SETTINGS_CONFIG: EmailSettingsConfig = {
    labels: {
        title: 'Email address',
        verified: 'verified',
        notVerified: 'not verified yet',
        sendVerification: 'Send a link to verify it',
        verificationSent: 'We sent you a link to verify your email address.',
        newEmail: 'New email address',
        change: 'Change email address',
        changeRequested: newEmail => `We sent a link to ${newEmail}. Your email address changes once you followed it.`,
        failed: 'Something went wrong. Please try again.'
    }
};

/**
 * What the email of the logged in user shows. Change it with provideEmailSettingsConfig.
 */
export const EMAIL_SETTINGS_CONFIG: InjectionToken<EmailSettingsConfig> = new InjectionToken<EmailSettingsConfig>('EMAIL_SETTINGS_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_EMAIL_SETTINGS_CONFIG
});

/**
 * Changes what the email of the logged in user shows, like its texts to translate them. Values you leave out keep the
 * ones of the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for EMAIL_SETTINGS_CONFIG.
 */
export function provideEmailSettingsConfig(config: EmailSettingsConfigChanges): Provider {
    return {
        provide: EMAIL_SETTINGS_CONFIG,
        useFactory: (): EmailSettingsConfig => {
            const parent: EmailSettingsConfig = inject(EMAIL_SETTINGS_CONFIG, { skipSelf: true, optional: true })
                ?? DEFAULT_EMAIL_SETTINGS_CONFIG;
            return { labels: { ...parent.labels, ...config.labels } };
        }
    };
}
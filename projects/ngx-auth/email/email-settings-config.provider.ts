import { inject, InjectionToken, Provider } from '@angular/core';

import { EmailSettingsConfigChanges } from './email-settings-config-changes.model';
import { EmailSettingsConfig } from './email-settings-config.model';

/**
 * What the email of the logged in user shows when nothing changes it. Its texts are $localize, which an app translates
 * like its own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultEmailSettingsConfig(): EmailSettingsConfig {
    return {
        labels: {
            title: $localize`:@@ngx-auth.email.title:Email address`,
            verified: $localize`:@@ngx-auth.email.verified:verified`,
            notVerified: $localize`:@@ngx-auth.email.notVerified:not verified yet`,
            sendVerification: $localize`:@@ngx-auth.email.sendVerification:Send a link to verify it`,
            verificationSent: $localize`:@@ngx-auth.email.verificationSent:We sent you a link to verify your email address.`,
            newEmail: $localize`:@@ngx-auth.email.newEmail:New email address`,
            change: $localize`:@@ngx-auth.email.change:Change email address`,
            changeRequested: newEmail => $localize`:@@ngx-auth.email.changeRequested:We sent a link to ${newEmail}:newEmail:. Your email address changes once you followed it.`,
            failed: $localize`:@@ngx-auth.email.failed:Something went wrong. Please try again.`
        }
    };
}

/**
 * What the email of the logged in user shows. Change it with provideEmailSettingsConfig.
 */
export const EMAIL_SETTINGS_CONFIG: InjectionToken<EmailSettingsConfig> = new InjectionToken<EmailSettingsConfig>('EMAIL_SETTINGS_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultEmailSettingsConfig()
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
                ?? getDefaultEmailSettingsConfig();
            return { labels: { ...parent.labels, ...config.labels } };
        }
    };
}
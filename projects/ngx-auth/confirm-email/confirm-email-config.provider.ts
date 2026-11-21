import { inject, InjectionToken, Provider } from '@angular/core';

import { ConfirmEmailConfigChanges } from './confirm-email-config-changes.model';
import { ConfirmEmailConfig } from './confirm-email-config.model';

/**
 * What the page the link of an email opens shows when nothing changes it. Its texts are $localize, which an app
 * translates like its own, and resolved once the config is injected, so translations an app loads at runtime apply as
 * well.
 * @returns The default config.
 */
function getDefaultConfirmEmailConfig(): ConfirmEmailConfig {
    return {
        labels: {
            title: $localize`:@@ngx-auth.confirm-email.title:Your email address`,
            verified: $localize`:@@ngx-auth.confirm-email.verified:Your email address is verified.`,
            changed: $localize`:@@ngx-auth.confirm-email.changed:Your email address was changed.`,
            waitingForOtherLink: $localize`:@@ngx-auth.confirm-email.waitingForOtherLink:Thank you. The change waits for you to follow the link we sent to your other email address as well.`,
            continue: $localize`:@@ngx-auth.confirm-email.continue:Continue`,
            login: $localize`:@@ngx-auth.confirm-email.login:Log in`,
            failed: $localize`:@@ngx-auth.confirm-email.failed:Something went wrong. Please try again.`
        }
    };
}

/**
 * What the page the link of an email opens shows. Change it with provideConfirmEmailConfig.
 */
export const CONFIRM_EMAIL_CONFIG: InjectionToken<ConfirmEmailConfig> = new InjectionToken<ConfirmEmailConfig>('CONFIRM_EMAIL_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultConfirmEmailConfig()
});

/**
 * Changes what the page the link of an email opens shows, like its texts to translate them. Values you leave out keep
 * the ones of the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for CONFIRM_EMAIL_CONFIG.
 */
export function provideConfirmEmailConfig(config: ConfirmEmailConfigChanges): Provider {
    return {
        provide: CONFIRM_EMAIL_CONFIG,
        useFactory: (): ConfirmEmailConfig => {
            const parent: ConfirmEmailConfig = inject(CONFIRM_EMAIL_CONFIG, { skipSelf: true, optional: true })
                ?? getDefaultConfirmEmailConfig();
            return { labels: { ...parent.labels, ...config.labels } };
        }
    };
}
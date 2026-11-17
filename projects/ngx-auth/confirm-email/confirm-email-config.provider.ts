import { inject, InjectionToken, Provider } from '@angular/core';

import { ConfirmEmailConfigChanges } from './confirm-email-config-changes.model';
import { ConfirmEmailConfig } from './confirm-email-config.model';

const DEFAULT_CONFIRM_EMAIL_CONFIG: ConfirmEmailConfig = {
    labels: {
        title: 'Your email address',
        verified: 'Your email address is verified.',
        changed: 'Your email address was changed.',
        waitingForOtherLink: 'Thank you. The change waits for you to follow the link we sent to your other email address as well.',
        continue: 'Continue',
        login: 'Log in',
        failed: 'Something went wrong. Please try again.'
    }
};

/**
 * What the page the link of an email opens shows. Change it with provideConfirmEmailConfig.
 */
export const CONFIRM_EMAIL_CONFIG: InjectionToken<ConfirmEmailConfig> = new InjectionToken<ConfirmEmailConfig>('CONFIRM_EMAIL_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_CONFIRM_EMAIL_CONFIG
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
                ?? DEFAULT_CONFIRM_EMAIL_CONFIG;
            return { labels: { ...parent.labels, ...config.labels } };
        }
    };
}
import { InjectionToken, Provider } from '@angular/core';
import { GdprCategory } from '@service-soft/ngx-tracking/consent';

import { ConsentDialogConfigChanges } from './consent-dialog-config-changes.model';
import { ConsentDialogConfig } from './consent-dialog-config.model';

const DEFAULT_CONSENT_DIALOG_CONFIG: ConsentDialogConfig = {
    paragraphs: [
        'We use technologies like cookies to improve our website and to analyze how it is used.',
        'Choose below what you allow. You can change your choices at any time.'
    ],
    privacyUrl: '/privacy',
    imprintUrl: '/imprint',
    showOnlyCategories: false,
    labels: {
        title: 'Privacy settings',
        allowAll: 'Allow all',
        onlyRequired: 'Only required',
        saveChoices: 'Save choices',
        categories: {
            [GdprCategory.TECHNICAL_NECESSARY]: 'Technically necessary',
            [GdprCategory.ENABLED_BY_DEFAULT]: 'Analytics',
            [GdprCategory.DISABLED_BY_DEFAULT]: 'Marketing'
        },
        privacy: 'Privacy policy',
        imprint: 'Imprint',
        doNotTrackNotice: 'Your browser asked not to be tracked, so we turned off everything that isn\'t required.'
    }
};

/**
 * What the consent dialog shows. Change it with provideConsentDialogConfig.
 */
export const CONSENT_DIALOG_CONFIG: InjectionToken<ConsentDialogConfig> = new InjectionToken<ConsentDialogConfig>('CONSENT_DIALOG_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_CONSENT_DIALOG_CONFIG
});

/**
 * Changes what the consent dialog shows, like its texts to translate them. Provide it in the application config: the
 * dialog opens from the root of the app and never sees a config further down. Values you leave out keep their
 * defaults, including single labels.
 * @param config - The values to change.
 * @returns The provider for CONSENT_DIALOG_CONFIG.
 */
export function provideConsentDialogConfig(config: ConsentDialogConfigChanges): Provider {
    const defaults: ConsentDialogConfig = DEFAULT_CONSENT_DIALOG_CONFIG;
    const consentDialogConfig: ConsentDialogConfig = {
        ...defaults,
        ...config,
        labels: { ...defaults.labels, ...config.labels, categories: { ...defaults.labels.categories, ...config.labels?.categories } }
    };
    return { provide: CONSENT_DIALOG_CONFIG, useValue: consentDialogConfig };
}
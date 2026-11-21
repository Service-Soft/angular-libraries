import { InjectionToken, Provider } from '@angular/core';

import { ConsentDialogConfigChanges } from './consent-dialog-config-changes.model';
import { ConsentDialogConfig } from './consent-dialog-config.model';
import { GdprCategory } from './gdpr-category.enum';

/**
 * What the consent dialog shows when nothing changes it. Its texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultConsentDialogConfig(): ConsentDialogConfig {
    return {
        paragraphs: [
            $localize`:@@ngx-tracking.consent.paragraphs.purpose:We use technologies like cookies to improve our website and to analyze how it is used.`,
            $localize`:@@ngx-tracking.consent.paragraphs.choices:Choose below what you allow. You can change your choices at any time.`
        ],
        privacyUrl: '/privacy',
        imprintUrl: '/imprint',
        showOnlyCategories: false,
        labels: {
            title: $localize`:@@ngx-tracking.consent.title:Privacy settings`,
            allowAll: $localize`:@@ngx-tracking.consent.allowAll:Allow all`,
            onlyRequired: $localize`:@@ngx-tracking.consent.onlyRequired:Only required`,
            saveChoices: $localize`:@@ngx-tracking.consent.saveChoices:Save choices`,
            categories: {
                [GdprCategory.TECHNICAL_NECESSARY]: $localize`:@@ngx-tracking.consent.categories.technicallyNecessary:Technically necessary`,
                [GdprCategory.ENABLED_BY_DEFAULT]: $localize`:@@ngx-tracking.consent.categories.analytics:Analytics`,
                [GdprCategory.DISABLED_BY_DEFAULT]: $localize`:@@ngx-tracking.consent.categories.marketing:Marketing`
            },
            privacy: $localize`:@@ngx-tracking.consent.privacy:Privacy policy`,
            imprint: $localize`:@@ngx-tracking.consent.imprint:Imprint`,
            doNotTrackNotice: $localize`:@@ngx-tracking.consent.doNotTrackNotice:Your browser asked not to be tracked, so we turned off everything that isn't required.`
        }
    };
}

/**
 * What the consent dialog of `@service-soft/ngx-tracking/consent-dialog` shows. Change it with
 * provideConsentDialogConfig.
 */
export const CONSENT_DIALOG_CONFIG: InjectionToken<ConsentDialogConfig> = new InjectionToken<ConsentDialogConfig>('CONSENT_DIALOG_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultConsentDialogConfig()
});

/**
 * Changes what the consent dialog shows, like its texts to translate them. Provide it in the application config: the
 * dialog opens from the root of the app and never sees a config further down. Values you leave out keep their
 * defaults, including single labels. It is part of this entry point rather than of the dialog's, so that the app
 * configures the dialog without loading it before it shows.
 * @param config - The values to change.
 * @returns The provider for CONSENT_DIALOG_CONFIG.
 */
export function provideConsentDialogConfig(config: ConsentDialogConfigChanges): Provider {
    return {
        provide: CONSENT_DIALOG_CONFIG,
        // a factory rather than a value: the apps call this while their config is built, which can be before they load
        // the translations of the defaults at runtime.
        useFactory: (): ConsentDialogConfig => {
            const defaults: ConsentDialogConfig = getDefaultConsentDialogConfig();
            return {
                ...defaults,
                ...config,
                labels: {
                    ...defaults.labels,
                    ...config.labels,
                    categories: { ...defaults.labels.categories, ...config.labels?.categories }
                }
            };
        }
    };
}
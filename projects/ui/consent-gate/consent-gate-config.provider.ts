import { inject, InjectionToken, Provider } from '@angular/core';

import { ConsentGateConfig } from './consent-gate-config.model';

/**
 * The values of a consent gate when nothing changes them. Its texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultConsentGateConfig(): ConsentGateConfig {
    return {
        privacyPolicyUrl: undefined,
        alwaysAllow: false,
        aspectRatio: undefined,
        title: provider => $localize`:@@ui.consent-gate.title:Content from ${provider}:provider:`,
        description: provider => $localize`:@@ui.consent-gate.description:To show it, your browser loads it from ${provider}:provider:, which receives data like your IP address and may set cookies.`,
        privacyPolicyLabel: $localize`:@@ui.consent-gate.privacyPolicyLabel:Privacy policy`,
        providerPrivacyPolicyLabel: provider => $localize`:@@ui.consent-gate.providerPrivacyPolicyLabel:Privacy policy of ${provider}:provider:`,
        loadLabel: provider => $localize`:@@ui.consent-gate.loadLabel:Load ${provider}:provider:`,
        alwaysAllowLabel: provider => $localize`:@@ui.consent-gate.alwaysAllowLabel:Always allow ${provider}:provider:`
    };
}

/**
 * The values every consent gate below this injector uses when its inputs are not set, and its texts.
 * Change them with provideConsentGateConfig.
 */
export const CONSENT_GATE_CONFIG: InjectionToken<ConsentGateConfig> = new InjectionToken<ConsentGateConfig>('CONSENT_GATE_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultConsentGateConfig()
});

/**
 * Changes the values consent gates use when their inputs are not set, and their texts, like the url of your privacy
 * policy or a translation. Provide it in the application config for the whole app, or in a component or route for only
 * that part of it. Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for CONSENT_GATE_CONFIG.
 */
export function provideConsentGateConfig(config: Partial<ConsentGateConfig>): Provider {
    return {
        provide: CONSENT_GATE_CONFIG,
        useFactory: (): ConsentGateConfig => ({
            ...inject(CONSENT_GATE_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultConsentGateConfig(),
            ...config
        })
    };
}
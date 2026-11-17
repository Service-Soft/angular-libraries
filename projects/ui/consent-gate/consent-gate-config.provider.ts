import { inject, InjectionToken, Provider } from '@angular/core';

import { ConsentGateConfig } from './consent-gate-config.model';

const DEFAULT_CONSENT_GATE_CONFIG: ConsentGateConfig = {
    privacyPolicyUrl: undefined,
    alwaysAllow: false,
    aspectRatio: undefined,
    title: provider => `Content from ${provider}`,
    description: provider => `To show it, your browser loads it from ${provider}, which receives data like your IP address `
        + 'and may set cookies.',
    privacyPolicyLabel: 'Privacy policy',
    providerPrivacyPolicyLabel: provider => `Privacy policy of ${provider}`,
    loadLabel: provider => `Load ${provider}`,
    alwaysAllowLabel: provider => `Always allow ${provider}`
};

/**
 * The values every consent gate below this injector uses when its inputs are not set, and its texts.
 * Change them with provideConsentGateConfig.
 */
export const CONSENT_GATE_CONFIG: InjectionToken<ConsentGateConfig> = new InjectionToken<ConsentGateConfig>('CONSENT_GATE_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_CONSENT_GATE_CONFIG
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
            ...inject(CONSENT_GATE_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_CONSENT_GATE_CONFIG,
            ...config
        })
    };
}
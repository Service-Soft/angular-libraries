import { inject, InjectionToken, Provider } from '@angular/core';

import { IdentitiesConfigChanges } from './identities-config-changes.model';
import { IdentitiesConfig } from './identities-config.model';

const DEFAULT_IDENTITIES_CONFIG: IdentitiesConfig = {
    labels: {
        title: 'Ways to log in',
        passkey: 'Passkey',
        passkeyAddedOn: date => `added on ${date}`,
        notForLogin: 'for its apis only',
        connect: name => `Connect ${name}`,
        addPasskey: 'Add a passkey',
        remove: 'Remove',
        removeTitle: 'Remove this way to log in?',
        removeMessage: 'You can\'t log in this way anymore. Keep another way to log in, like your password.',
        cancel: 'Cancel',
        passkeyAdded: 'Passkey added.',
        removed: 'Removed.',
        failed: 'Something went wrong. Please try again.'
    },
    providers: [],
    passkeyAuthenticator: undefined
};

/**
 * How the ways to log in of the logged in user look and work. Change it with provideIdentitiesConfig.
 */
export const IDENTITIES_CONFIG: InjectionToken<IdentitiesConfig> = new InjectionToken<IdentitiesConfig>('IDENTITIES_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_IDENTITIES_CONFIG
});

/**
 * Changes how the ways to log in of the logged in user look and work, like the providers to connect and the texts to
 * translate them. Values you leave out keep the ones of the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for IDENTITIES_CONFIG.
 */
export function provideIdentitiesConfig(config: IdentitiesConfigChanges): Provider {
    return {
        provide: IDENTITIES_CONFIG,
        useFactory: (): IdentitiesConfig => {
            const parent: IdentitiesConfig = inject(IDENTITIES_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_IDENTITIES_CONFIG;
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
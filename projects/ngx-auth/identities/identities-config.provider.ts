import { inject, InjectionToken, Provider } from '@angular/core';

import { IdentitiesConfigChanges } from './identities-config-changes.model';
import { IdentitiesConfig } from './identities-config.model';

/**
 * How the ways to log in of the logged in user look and work when nothing changes it. Its texts are $localize, which an
 * app translates like its own, and resolved once the config is injected, so translations an app loads at runtime apply
 * as well.
 * @returns The default config.
 */
function getDefaultIdentitiesConfig(): IdentitiesConfig {
    return {
        labels: {
            title: $localize`:@@ngx-auth.identities.title:Ways to log in`,
            passkey: $localize`:@@ngx-auth.identities.passkey:Passkey`,
            passkeyAddedOn: date => $localize`:@@ngx-auth.identities.passkeyAddedOn:added on ${date}:date:`,
            notForLogin: $localize`:@@ngx-auth.identities.notForLogin:for its apis only`,
            connect: name => $localize`:@@ngx-auth.identities.connect:Connect ${name}:name:`,
            addPasskey: $localize`:@@ngx-auth.identities.addPasskey:Add a passkey`,
            remove: $localize`:@@ngx-auth.identities.remove:Remove`,
            removeTitle: $localize`:@@ngx-auth.identities.removeTitle:Remove this way to log in?`,
            removeMessage: $localize`:@@ngx-auth.identities.removeMessage:You can't log in this way anymore. Keep another way to log in, like your password.`,
            cancel: $localize`:@@ngx-auth.identities.cancel:Cancel`,
            passkeyAdded: $localize`:@@ngx-auth.identities.passkeyAdded:Passkey added.`,
            removed: $localize`:@@ngx-auth.identities.removed:Removed.`,
            failed: $localize`:@@ngx-auth.identities.failed:Something went wrong. Please try again.`
        },
        providers: [],
        passkeyAuthenticator: undefined
    };
}

/**
 * How the ways to log in of the logged in user look and work. Change it with provideIdentitiesConfig.
 */
export const IDENTITIES_CONFIG: InjectionToken<IdentitiesConfig> = new InjectionToken<IdentitiesConfig>('IDENTITIES_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultIdentitiesConfig()
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
            const parent: IdentitiesConfig = inject(IDENTITIES_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultIdentitiesConfig();
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
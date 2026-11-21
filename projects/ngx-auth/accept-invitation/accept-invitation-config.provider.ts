import { inject, InjectionToken, Provider } from '@angular/core';

import { AcceptInvitationConfigChanges } from './accept-invitation-config-changes.model';
import { AcceptInvitationConfig } from './accept-invitation-config.model';

/**
 * How the page the link of an invitation opens looks and works when nothing changes it. Its texts are $localize, which
 * an app translates like its own, and resolved once the config is injected, so translations an app loads at runtime
 * apply as well.
 * @returns The default config.
 */
function getDefaultAcceptInvitationConfig(): AcceptInvitationConfig {
    return {
        labels: {
            title: $localize`:@@ngx-auth.accept-invitation.title:Invitation`,
            invitedAs: email => $localize`:@@ngx-auth.accept-invitation.invitedAs:You are invited as ${email}:email:`,
            invalid: $localize`:@@ngx-auth.accept-invitation.invalid:This link doesn't work. It ran out, or was used or revoked already.`,
            renewed: $localize`:@@ngx-auth.accept-invitation.renewed:This link ran out. A new one was mailed to the invited address.`,
            password: $localize`:@@ngx-auth.accept-invitation.password:Password`,
            accept: $localize`:@@ngx-auth.accept-invitation.accept:Accept invitation`,
            decline: $localize`:@@ngx-auth.accept-invitation.decline:Decline`,
            loginRequired: $localize`:@@ngx-auth.accept-invitation.loginRequired:Log in as the invited account to accept the invitation.`,
            otherAccount: $localize`:@@ngx-auth.accept-invitation.otherAccount:You are logged in with another account. Log out, and log in as the invited one to accept the invitation.`,
            login: $localize`:@@ngx-auth.accept-invitation.login:Log in`,
            logout: $localize`:@@ngx-auth.accept-invitation.logout:Log out`,
            accepted: $localize`:@@ngx-auth.accept-invitation.accepted:The invitation was accepted.`,
            acceptedWithPassword: $localize`:@@ngx-auth.accept-invitation.acceptedWithPassword:Your account is ready. Log in with your password.`,
            continue: $localize`:@@ngx-auth.accept-invitation.continue:Continue`,
            declined: $localize`:@@ngx-auth.accept-invitation.declined:The invitation was declined.`,
            failed: $localize`:@@ngx-auth.accept-invitation.failed:Something went wrong. Please try again.`
        },
        newPasswordMinLength: undefined
    };
}

/**
 * How the page the link of an invitation opens looks and works. Change it with provideAcceptInvitationConfig.
 */
export const ACCEPT_INVITATION_CONFIG: InjectionToken<AcceptInvitationConfig> = new InjectionToken<AcceptInvitationConfig>(
    'ACCEPT_INVITATION_CONFIG',
    { providedIn: 'root', factory: () => getDefaultAcceptInvitationConfig() }
);

/**
 * Changes how the page the link of an invitation opens looks and works, like its texts to translate them. Values you
 * leave out keep the ones of the parent injector, including single labels.
 * @param config - The values to change.
 * @returns The provider for ACCEPT_INVITATION_CONFIG.
 */
export function provideAcceptInvitationConfig(config: AcceptInvitationConfigChanges): Provider {
    return {
        provide: ACCEPT_INVITATION_CONFIG,
        useFactory: (): AcceptInvitationConfig => {
            const parent: AcceptInvitationConfig = inject(ACCEPT_INVITATION_CONFIG, { skipSelf: true, optional: true })
                ?? getDefaultAcceptInvitationConfig();
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
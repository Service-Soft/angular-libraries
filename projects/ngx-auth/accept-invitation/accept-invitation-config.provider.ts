import { inject, InjectionToken, Provider } from '@angular/core';

import { AcceptInvitationConfigChanges } from './accept-invitation-config-changes.model';
import { AcceptInvitationConfig } from './accept-invitation-config.model';

const DEFAULT_ACCEPT_INVITATION_CONFIG: AcceptInvitationConfig = {
    labels: {
        title: 'Invitation',
        invitedAs: 'You are invited as',
        invalid: 'This link doesn\'t work. It ran out, or was used or revoked already.',
        renewed: 'This link ran out. A new one was mailed to the invited address.',
        password: 'Password',
        accept: 'Accept invitation',
        decline: 'Decline',
        loginRequired: 'Log in as the invited account to accept the invitation.',
        otherAccount: 'You are logged in with another account. Log out, and log in as the invited one to accept the invitation.',
        login: 'Log in',
        logout: 'Log out',
        accepted: 'The invitation was accepted.',
        acceptedWithPassword: 'Your account is ready. Log in with your password.',
        continue: 'Continue',
        declined: 'The invitation was declined.',
        failed: 'Something went wrong. Please try again.'
    },
    newPasswordMinLength: undefined
};

/**
 * How the page the link of an invitation opens looks and works. Change it with provideAcceptInvitationConfig.
 */
export const ACCEPT_INVITATION_CONFIG: InjectionToken<AcceptInvitationConfig> = new InjectionToken<AcceptInvitationConfig>(
    'ACCEPT_INVITATION_CONFIG',
    { providedIn: 'root', factory: () => DEFAULT_ACCEPT_INVITATION_CONFIG }
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
                ?? DEFAULT_ACCEPT_INVITATION_CONFIG;
            return { ...parent, ...config, labels: { ...parent.labels, ...config.labels } };
        }
    };
}
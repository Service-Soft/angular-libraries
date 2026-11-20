import { AcceptInvitationConfig, AcceptInvitationLabels } from './accept-invitation-config.model';

/**
 * The values to change in the config of the page the link of an invitation opens. Everything is optional, including
 * every single label.
 */
export type AcceptInvitationConfigChanges = Partial<Omit<AcceptInvitationConfig, 'labels'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<AcceptInvitationLabels>
};
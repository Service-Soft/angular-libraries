/**
 * Where the page of an invitation stands: checking the link, refusing a link that doesn't work, asking for the
 * password of the account it creates, asking to log in or to log out of another account, offering to accept, or
 * done.
 */
export type AcceptInvitationState
    = 'verifying' | 'invalid' | 'password' | 'loginRequired' | 'otherAccount' | 'accept' | 'accepted' | 'declined';
/**
 * The texts of the page the link of an invitation opens.
 */
export type AcceptInvitationLabels = {
    /**
     * The heading of the page.
     */
    title: string,
    /**
     * Shown before the invited email.
     */
    invitedAs: string,
    /**
     * Shown when the link doesn't work, like when it was used, revoked or ran out.
     */
    invalid: string,
    /**
     * Shown when the link ran out and zibri mailed a new one to the invited email.
     */
    renewed: string,
    /**
     * The label of the input of the password of the account the invitation creates.
     */
    password: string,
    /**
     * The button that accepts the invitation.
     */
    accept: string,
    /**
     * The button that declines the invitation.
     */
    decline: string,
    /**
     * Shown when accepting needs a login as the invited account, while nobody is logged in.
     */
    loginRequired: string,
    /**
     * Shown while somebody else than the invited email is logged in.
     */
    otherAccount: string,
    /**
     * The link to the login.
     */
    login: string,
    /**
     * The button that logs out of another account.
     */
    logout: string,
    /**
     * Shown once the invitation was accepted by a logged in account.
     */
    accepted: string,
    /**
     * Shown once the invitation was accepted with the password of the account it created.
     */
    acceptedWithPassword: string,
    /**
     * The link on into the app once the invitation was accepted by a logged in account.
     */
    continue: string,
    /**
     * Shown once the invitation was declined.
     */
    declined: string,
    /**
     * Shown when a request failed without a message of zibri, like without a connection.
     */
    failed: string
};

/**
 * How the page the link of an invitation opens looks and works.
 */
export type AcceptInvitationConfig = {
    /**
     * The texts of the page.
     */
    labels: AcceptInvitationLabels,
    /**
     * The least number of characters of the password of the account an invitation creates, the minLength of the
     * password policy of zibri. Without it, zibri says what is too short.
     */
    newPasswordMinLength: number | undefined
};
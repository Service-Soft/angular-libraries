/**
 * The texts of the page the link of an email opens.
 */
export type ConfirmEmailLabels = {
    /**
     * The heading of the page.
     */
    title: string,
    /**
     * Shown once the email was verified.
     */
    verified: string,
    /**
     * Shown once the email was changed.
     */
    changed: string,
    /**
     * Shown when the change still waits for the link to the other email.
     */
    waitingForOtherLink: string,
    /**
     * The link into the app, for a logged in user.
     */
    continue: string,
    /**
     * The link to the login, for a user who isn't logged in.
     */
    login: string,
    /**
     * Shown when the request failed without a message of zibri, like without a connection.
     */
    failed: string
};

/**
 * What the page the link of an email opens shows.
 */
export type ConfirmEmailConfig = {
    /**
     * The texts of the page.
     */
    labels: ConfirmEmailLabels
};
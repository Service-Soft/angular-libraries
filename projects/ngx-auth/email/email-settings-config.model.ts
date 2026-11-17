/**
 * The texts of the email of the logged in user.
 */
export type EmailSettingsLabels = {
    /**
     * The heading.
     */
    title: string,
    /**
     * Shown next to an email that is verified.
     */
    verified: string,
    /**
     * Shown next to an email that isn't verified yet.
     */
    notVerified: string,
    /**
     * The button that mails a link to verify the email.
     */
    sendVerification: string,
    /**
     * Announced once the link to verify the email was mailed.
     */
    verificationSent: string,
    /**
     * The label of the input of the new email.
     */
    newEmail: string,
    /**
     * The button that mails the link of the change.
     */
    change: string,
    /**
     * Announced once the link of a change was mailed, from the new email.
     */
    changeRequested: (newEmail: string) => string,
    /**
     * Shown when a request failed without a message of zibri, like without a connection.
     */
    failed: string
};

/**
 * What the email of the logged in user shows.
 */
export type EmailSettingsConfig = {
    /**
     * The texts.
     */
    labels: EmailSettingsLabels
};
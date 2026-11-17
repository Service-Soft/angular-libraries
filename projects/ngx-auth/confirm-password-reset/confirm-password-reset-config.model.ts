/**
 * The texts of the page that sets a new password with the link of a password reset.
 */
export type ConfirmPasswordResetLabels = {
    /**
     * The heading of the page.
     */
    title: string,
    /**
     * The label of the input of the new password.
     */
    newPassword: string,
    /**
     * The button that sets the new password.
     */
    save: string,
    /**
     * Shown when the link doesn't work anymore, like when it ran out or was used already.
     */
    invalid: string,
    /**
     * The link to the page that sends a new link.
     */
    requestNewLink: string,
    /**
     * Shown once the password was changed.
     */
    changed: string,
    /**
     * The link to the login, once the password was changed.
     */
    login: string,
    /**
     * Shown when a request failed without a message of zibri, like without a connection.
     */
    failed: string
};

/**
 * How the page that sets a new password with the link of a password reset looks and works.
 */
export type ConfirmPasswordResetConfig = {
    /**
     * The texts of the page.
     */
    labels: ConfirmPasswordResetLabels,
    /**
     * The route of the page that sends a new link.
     */
    requestPasswordResetRoute: string,
    /**
     * The least number of characters of a new password, the minLength of the password policy of zibri. Without it,
     * zibri says what is too short.
     */
    newPasswordMinLength: number | undefined
};
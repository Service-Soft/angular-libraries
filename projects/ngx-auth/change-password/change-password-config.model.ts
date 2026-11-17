/**
 * The texts of the form that changes the password of the logged in user.
 */
export type ChangePasswordLabels = {
    /**
     * The heading of the form.
     */
    title: string,
    /**
     * The label of the input of the current password.
     */
    currentPassword: string,
    /**
     * The label of the input of the new password.
     */
    newPassword: string,
    /**
     * The button that changes the password.
     */
    save: string,
    /**
     * Announced once the password was changed.
     */
    changed: string,
    /**
     * Shown when the request failed without a message of zibri, like without a connection.
     */
    failed: string
};

/**
 * How the form that changes the password of the logged in user looks and works.
 */
export type ChangePasswordConfig = {
    /**
     * The texts of the form.
     */
    labels: ChangePasswordLabels,
    /**
     * The least number of characters of a new password, the minLength of the password policy of zibri. Without it,
     * zibri says what is too short.
     */
    newPasswordMinLength: number | undefined
};
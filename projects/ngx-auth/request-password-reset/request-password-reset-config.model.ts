/**
 * The texts of the page that sends a link to reset the password.
 */
export type RequestPasswordResetLabels = {
    /**
     * The heading of the page.
     */
    title: string,
    /**
     * Says what the page does.
     */
    message: string,
    /**
     * The label of the email input.
     */
    email: string,
    /**
     * The button that sends the link.
     */
    send: string,
    /**
     * Shown once zibri took the email. It answers the same whether the email has an account or not, so nobody can find
     * out which emails have one.
     */
    sent: string,
    /**
     * The link back to the login.
     */
    backToLogin: string,
    /**
     * Shown when the request failed without a message of zibri, like without a connection.
     */
    failed: string
};

/**
 * What the page that sends a link to reset the password shows.
 */
export type RequestPasswordResetConfig = {
    /**
     * The texts of the page.
     */
    labels: RequestPasswordResetLabels
};
/**
 * The texts of the page a failed login at a provider lands on.
 */
export type ProviderErrorLabels = {
    /**
     * The heading of the page.
     */
    title: string,
    /**
     * What went wrong, by the `error` of zibri, like 'cancelled'. An error without a text shows the one of 'failed'.
     */
    errors: Partial<Record<string, string>> & Record<'failed', string>,
    /**
     * The link back to the login, for a user who isn't logged in.
     */
    backToLogin: string,
    /**
     * The link back into the app, for a logged in user whose provider couldn't be connected.
     */
    backToApp: string
};

/**
 * What the page a failed login at a provider lands on shows.
 */
export type ProviderErrorConfig = {
    /**
     * The texts of the page.
     */
    labels: ProviderErrorLabels
};
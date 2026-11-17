/**
 * The texts of where the logged in user is logged in.
 */
export type SessionsLabels = {
    /**
     * The heading.
     */
    title: string,
    /**
     * Shown for the login of this browser.
     */
    thisDevice: string,
    /**
     * Shown for a login whose browser zibri doesn't know.
     */
    unknownBrowser: string,
    /**
     * When a login was last used, from the date as the app shows dates.
     */
    lastUsedOn: (date: string) => string,
    /**
     * The button that ends one login.
     */
    logout: string,
    /**
     * The button that ends every login.
     */
    logoutEverywhere: string,
    /**
     * The question before every login is ended.
     */
    logoutEverywhereTitle: string,
    /**
     * Says what ending every login does.
     */
    logoutEverywhereMessage: string,
    /**
     * The button that keeps the logins when asked whether to end them.
     */
    cancel: string,
    /**
     * Announced once a login was ended.
     */
    loggedOut: string,
    /**
     * Shown when a request failed without a message of zibri, like without a connection.
     */
    failed: string
};

/**
 * What the list of where the logged in user is logged in shows.
 */
export type SessionsConfig = {
    /**
     * The texts.
     */
    labels: SessionsLabels
};
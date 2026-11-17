/**
 * A provider the login offers to log in at, like Google.
 */
export type LoginProvider = {
    /**
     * The name of its authenticator in zibri, like 'google'.
     */
    authenticator: string,
    /**
     * The text of its button, like 'Log in with Google'.
     */
    label: string,
    /**
     * The scopes of the provider's apis the login asks for as well, like a calendar the app reads, whose tokens zibri
     * keeps for the user. Each has to be one of the `apiScopes` of the authenticator. None by default.
     */
    apiScopes?: string[]
};
/**
 * A login at a provider this tab started, which the browser keeps in the sessionStorage while it is at the provider.
 */
export type PendingProviderLogin = {
    /**
     * The name of the authenticator of the provider, like 'google'.
     */
    authenticator: string,
    /**
     * The PKCE verifier, which only this tab knows.
     */
    codeVerifier: string,
    /**
     * Where the app goes once the user is logged in, like the page they wanted.
     */
    returnUrl: string | undefined
};
/**
 * Another way to log in than with the password, as the login offers it: a passkey, or a provider.
 */
export type OtherLogin = {
    /**
     * Whether it logs in with a passkey or at a provider.
     */
    kind: 'passkey' | 'provider',
    /**
     * The name of its authenticator in zibri.
     */
    authenticator: string,
    /**
     * The text of its button.
     */
    label: string,
    /**
     * The scopes of the provider's apis a provider login asks for as well.
     */
    apiScopes?: string[]
};
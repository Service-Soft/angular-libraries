/**
 * What zibri lists of an identity linked to the user, as far as the auth reads it.
 */
export type LinkedIdentityDetails = {
    /**
     * The id, which unlinks it.
     */
    id: string,
    /**
     * Whether the user logs in with it, for an identity at a provider. False when it is for the provider's apis only.
     */
    forLogin?: boolean,
    /**
     * The scopes of the provider's apis it granted, for an identity at a provider. Empty when zibri keeps no tokens.
     */
    grantedScopes?: string[],
    /**
     * When it was added, as an ISO string, for a passkey.
     */
    createdAt?: string,
    /**
     * When it was last used, as an ISO string, for a passkey that was.
     */
    lastUsedAt?: string
};
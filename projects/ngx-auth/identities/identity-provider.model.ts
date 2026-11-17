import { IdentityApiAccess } from './identity-api-access.model';

/**
 * A provider the user can connect to their account, like Google.
 */
export type IdentityProvider = {
    /**
     * The name of its authenticator in zibri, like 'google'.
     */
    authenticator: string,
    /**
     * The name the user reads, like 'Google'.
     */
    name: string,
    /**
     * The scopes of the provider's apis connecting it asks for as well. None by default.
     */
    apiScopes?: string[],
    /**
     * Access to the provider's apis the list offers once it is connected, a button for each the provider hasn't
     * granted all scopes of yet, which connects it again with them.
     */
    apiAccess?: IdentityApiAccess[]
};
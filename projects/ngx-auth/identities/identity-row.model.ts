import { IdentityApiAccess } from './identity-api-access.model';

/**
 * A linked identity, as the ways to log in show it.
 */
export type IdentityRow = {
    /**
     * The id of the identity.
     */
    id: string,
    /**
     * The name of its authenticator in zibri.
     */
    authenticator: string,
    /**
     * Whether the user logs in with it, which connecting it again keeps.
     */
    forLogin: boolean,
    /**
     * The id of its name, which its buttons are described by.
     */
    nameId: string,
    /**
     * The name the user reads, like 'Google' or 'Passkey'.
     */
    name: string,
    /**
     * More about it, like when a passkey was added. Empty when there is nothing more.
     */
    detail: string,
    /**
     * The access to apis the app asks for that the provider hasn't granted yet.
     */
    missingAccess: IdentityApiAccess[]
};
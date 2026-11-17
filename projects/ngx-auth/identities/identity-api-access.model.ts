/**
 * Access to apis of a provider the app asks the user for, like their calendar.
 */
export type IdentityApiAccess = {
    /**
     * The text of the button that asks for it, like 'Allow access to your calendar'.
     */
    label: string,
    /**
     * The scopes of the provider's apis it needs. Each has to be one of the `apiScopes` of the authenticator in zibri.
     */
    scopes: string[]
};
import { IdentityProvider } from './identity-provider.model';

/**
 * The texts of the ways to log in of the logged in user.
 */
export type IdentitiesLabels = {
    /**
     * The heading.
     */
    title: string,
    /**
     * The name of a passkey.
     */
    passkey: string,
    /**
     * When a passkey was added, from the date as the app shows dates.
     */
    passkeyAddedOn: (date: string) => string,
    /**
     * Shown next to an account at a provider that grants access to its apis, but doesn't log in.
     */
    notForLogin: string,
    /**
     * The button that connects a provider, from its name.
     */
    connect: (name: string) => string,
    /**
     * The button that adds a passkey.
     */
    addPasskey: string,
    /**
     * The button that removes a way to log in.
     */
    remove: string,
    /**
     * The question before a way to log in is removed.
     */
    removeTitle: string,
    /**
     * Says what removing a way to log in does.
     */
    removeMessage: string,
    /**
     * The button that keeps a way to log in when asked whether to remove it.
     */
    cancel: string,
    /**
     * Announced once a passkey was added.
     */
    passkeyAdded: string,
    /**
     * Announced once a way to log in was removed.
     */
    removed: string,
    /**
     * Shown when a request failed without a message of zibri, like without a connection.
     */
    failed: string
};

/**
 * How the ways to log in of the logged in user look and work.
 */
export type IdentitiesConfig = {
    /**
     * The texts.
     */
    labels: IdentitiesLabels,
    /**
     * The providers the user can connect, which zibri needs to allow the page as a redirect.
     */
    providers: IdentityProvider[],
    /**
     * The name of the passkey authenticator of zibri, which offers to add a passkey, or undefined for an app without
     * one.
     */
    passkeyAuthenticator: string | undefined
};
/**
 * What a device that isn't there answers when the browser asks it for a passkey.
 */
export type FakePasskeyDevice = {
    /**
     * The answer to using a passkey, like for a login.
     */
    assertion?: AuthenticationResponseJSON,
    /**
     * The answer to creating a passkey.
     */
    attestation?: RegistrationResponseJSON,
    /**
     * Whether the user cancels, which the browser answers with a NotAllowedError.
     */
    cancels?: boolean,
    /**
     * Whether the browser offers the passkeys in the autofill of an input, like the email of a login. A request of the
     * autofill waits until the test picks it with pickFromAutofill.
     */
    autofill?: boolean
};

/**
 * A device the tests use, and what the browser asked it.
 */
export type AddedPasskeyDevice = {
    /**
     * The options of every request to use a passkey, as the page gave them to the browser.
     */
    requests: unknown[],
    /**
     * The options of every request to create a passkey.
     */
    creations: unknown[],
    /**
     * Whether the page waits for a passkey of the autofill.
     */
    isWaitingInAutofill: () => boolean,
    /**
     * Picks the passkey in the autofill, like the user does in the list below the email, which answers the request the
     * page waits with.
     * @throws {Error} When the page waits for none.
     */
    pickFromAutofill: () => void,
    /**
     * Takes the device away again, to call after each test.
     */
    remove: () => void
};
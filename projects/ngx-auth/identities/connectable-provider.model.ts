/**
 * A provider the user hasn't connected yet, with the text of its button.
 */
export type ConnectableProvider = {
    /**
     * The name of its authenticator in zibri.
     */
    authenticator: string,
    /**
     * The text of the button that connects it.
     */
    label: string
};
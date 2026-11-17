/**
 * The texts of the dialog that shows an error.
 */
export type ErrorDialogLabels = {
    /**
     * The heading when zibri refused a request, like for a wrong value.
     */
    refusedTitle: string,
    /**
     * The heading when something went wrong on the server, or in the app.
     */
    failedTitle: string,
    /**
     * The heading when a request found no connection.
     */
    offlineTitle: string,
    /**
     * Shown when the error says nothing a user understands, like a mistake in the app.
     */
    failedParagraphs: string[],
    /**
     * Shown when a request found no connection.
     */
    offlineParagraphs: string[],
    /**
     * A problem of a value zibri refused, from its key and its message.
     */
    problem: (key: string, message: string) => string,
    /**
     * The reference support finds the request by, from the trace id of zibri.
     */
    reference: (traceId: string) => string,
    /**
     * The button that closes the dialog.
     */
    close: string
};

/**
 * Which errors the dialog shows, and how.
 */
export type ErrorDialogConfig = {
    /**
     * The texts of the dialog.
     */
    labels: ErrorDialogLabels,
    /**
     * The statuses of failed requests that show no dialog, like 401, after which the auth sends the user to the login.
     */
    ignoredStatuses: number[],
    /**
     * Whether an error shows no dialog, besides the ignoredStatuses, like one your app tells the user of itself.
     */
    isIgnored: (error: unknown) => boolean
};
/**
 * The texts of the dialog that asks to reload, when a new version of the app is ready or the running one is broken.
 */
export type UpdatesLabels = {
    /**
     * The heading of the dialog when a new version is ready.
     */
    newVersionTitle: string,
    /**
     * The text of the dialog when a new version is ready.
     */
    newVersionMessage: string,
    /**
     * The heading of the dialog when parts of the running version can't be loaded anymore.
     */
    unrecoverableTitle: string,
    /**
     * The text of the dialog when parts of the running version can't be loaded anymore.
     */
    unrecoverableMessage: string,
    /**
     * The button that reloads the app.
     */
    reload: string,
    /**
     * The button that closes the dialog without reloading.
     */
    notNow: string
};

/**
 * How the user is told about a new version of the app.
 */
export type UpdatesConfig = {
    /**
     * The texts of the dialog.
     */
    labels: UpdatesLabels
};
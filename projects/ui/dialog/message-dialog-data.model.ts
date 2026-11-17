/**
 * What a MessageDialogComponent says.
 */
export type MessageDialogData = {
    /**
     * What happened, shown as the heading and the name of the dialog.
     */
    title: string,
    /**
     * The text of the message, one paragraph per item.
     */
    paragraphs: string[],
    /**
     * The label of the button that closes the dialog, like 'OK'.
     */
    closeButtonLabel: string
};
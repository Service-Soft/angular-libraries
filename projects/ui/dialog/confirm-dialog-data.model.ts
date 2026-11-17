import { ButtonColor } from '@service-soft/ui/button';

/**
 * What a ConfirmDialogComponent asks.
 */
export type ConfirmDialogData = {
    /**
     * The question, shown as the heading and the name of the dialog.
     */
    title: string,
    /**
     * Text that explains what confirming does, one paragraph per item.
     */
    paragraphs: string[],
    /**
     * The label of the button that confirms, which says what it does, like 'Delete'.
     */
    confirmButtonLabel: string,
    /**
     * The label of the button that cancels.
     */
    cancelButtonLabel: string,
    /**
     * The color of the confirm button, like 'error' for something that can't be undone. Defaults to primary.
     */
    confirmButtonColor?: ButtonColor
};
import { DialogSize } from './dialog-size.type';

/**
 * How a dialog that the DialogService opens behaves.
 */
export type DialogOptions = {
    /**
     * Whether escape closes the dialog. Turn it off only for a dialog the user has to answer, whose content then
     * needs a button that closes it.
     * @default true
     */
    closeOnEscape?: boolean,
    /**
     * How wide the dialog gets at most: md for a message or a question, lg for a form whose fields sit side by side,
     * fullscreen for content that takes the whole screen, like the pictures of a gallery.
     * @default 'md'
     */
    size?: DialogSize
};
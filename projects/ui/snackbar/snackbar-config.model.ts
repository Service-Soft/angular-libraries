import { SnackbarColor } from './snackbar-color.type';

/**
 * How snackbars behave.
 */
export type SnackbarConfig = {
    /**
     * How long a message shows, in milliseconds.
     */
    duration: number,
    /**
     * The color a message shows in.
     */
    color: SnackbarColor
};
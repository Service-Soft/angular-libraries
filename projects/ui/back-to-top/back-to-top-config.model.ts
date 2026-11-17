import { ButtonColor } from '@service-soft/ui/button';

/**
 * The values the button that goes back to the top of the page uses when its inputs are not set, and its texts.
 */
export type BackToTopConfig = {
    /**
     * The color token the button is drawn with, filled.
     */
    color: ButtonColor,
    /**
     * The name of the button, which only shows an arrow.
     */
    label: string
};
import { ButtonColor } from './button-color.type';
import { ButtonElevation } from './button-elevation.type';
import { ButtonSize } from './button-size.type';
import { ButtonVariant } from './button-variant.type';

/**
 * The values a button uses when its inputs are not set.
 */
export type ButtonConfig = {
    /**
     * How much the button stands out.
     */
    variant: ButtonVariant,
    /**
     * The color token the button is drawn with.
     */
    color: ButtonColor,
    /**
     * The height, padding and font size of the button.
     */
    size: ButtonSize,
    /**
     * How far the button floats above the surface, 0 for no shadow.
     */
    elevation: ButtonElevation
};
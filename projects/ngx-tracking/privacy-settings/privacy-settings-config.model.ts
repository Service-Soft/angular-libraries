import { ButtonColor } from '@service-soft/ui/button';

/**
 * The values the button that opens the privacy settings uses when its inputs are not set, and its texts.
 */
export type PrivacySettingsConfig = {
    /**
     * The color token the button is drawn with, filled.
     */
    color: ButtonColor,
    /**
     * The name of the button, which only shows an icon.
     */
    label: string
};
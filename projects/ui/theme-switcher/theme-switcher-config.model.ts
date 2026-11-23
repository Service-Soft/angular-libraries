import { IconDefinition } from '@service-soft/ui/icon';

import { ThemeMode } from './theme-mode.type';

/**
 * The values a theme switcher uses when its inputs are not set.
 */
export type ThemeSwitcherConfig = {
    /**
     * What screen readers call the switcher, read before the current mode on its button.
     */
    label: string,
    /**
     * The name of each mode, in the menu and for screen readers on the button.
     */
    modeLabels: Record<ThemeMode, string>,
    /**
     * The icon of each mode, in the menu and on the button while it is the current one.
     */
    modeIcons: Record<ThemeMode, IconDefinition>
};
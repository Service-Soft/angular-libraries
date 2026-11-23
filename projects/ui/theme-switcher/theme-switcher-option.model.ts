import { IconDefinition } from '@service-soft/ui/icon';

import { ThemeMode } from './theme-mode.type';

/**
 * A mode of the theme switcher, as its menu shows it.
 */
export type ThemeSwitcherOption = {
    /**
     * The mode it chooses.
     */
    mode: ThemeMode,
    /**
     * The name of the mode.
     */
    label: string,
    /**
     * The icon of the mode.
     */
    icon: IconDefinition,
    /**
     * Whether it is the current mode.
     */
    isCurrent: boolean
};
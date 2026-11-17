import { IconDefinition } from '@service-soft/ui/icon';

import { LanguageSwitcherAppearance } from './language-switcher-appearance.type';
import { LanguageSwitcherHref } from './language-switcher-href.type';

/**
 * The values a language switcher uses when its inputs are not set.
 */
export type LanguageSwitcherConfig = {
    /**
     * Whether the languages are in a menu or a row of links.
     */
    appearance: LanguageSwitcherAppearance,
    /**
     * What screen readers call the switcher, read before the current language on the button of the menu.
     */
    label: string,
    /**
     * The icon of the button of the menu.
     */
    icon: IconDefinition,
    /**
     * Builds the address of the current page in a language that has no href of its own.
     */
    href: LanguageSwitcherHref
};
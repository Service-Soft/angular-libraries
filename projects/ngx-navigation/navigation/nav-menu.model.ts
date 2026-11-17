import { IconDefinition } from '@service-soft/ui/icon';

import { NavButton } from './nav-button.model';
import { NavConditional } from './nav-conditional.model';
import { NavCustom } from './nav-custom.model';
import { NavLink } from './nav-link.model';

/**
 * Several links and buttons under one name. A menu inside of a menu opens beside it. In the drawer it is a section
 * that opens.
 */
export type NavMenu = NavConditional & {
    /**
     * Says that it is a menu.
     */
    type: 'menu',
    /**
     * The text of the button that opens the menu.
     */
    name: string,
    /**
     * An icon in front of the name.
     */
    icon?: IconDefinition,
    /**
     * What is in the menu.
     */
    elements: NavMenuElement[]
};

/**
 * What can be inside of a menu. A custom component shows in the menu and, once the menu collapsed, in the drawer:
 * `inject(MenuComponent, { optional: true })` of `@service-soft/ui/menu` tells it which, so it can show its actions as
 * `ui-menu-item` or `ui-menu-link` in the menu.
 */
export type NavMenuElement = NavLink | NavButton | NavMenu | NavCustom;
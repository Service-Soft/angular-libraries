import { NavCollapse } from '@service-soft/ngx-navigation/navigation';
import { IconDefinition } from '@service-soft/ui/icon';

import { NavbarColor } from './navbar-color.type';

/**
 * The texts of the navbar.
 */
export type NavbarLabels = {
    /**
     * What screen readers call the navigation of the navbar and the drawer.
     */
    navigation: string,
    /**
     * What screen readers call the button that opens the drawer.
     */
    openNavigation: string
};

/**
 * The values the navbar uses when its inputs or those of its elements are not set.
 */
export type NavbarConfig = {
    /**
     * The texts.
     */
    labels: NavbarLabels,
    /**
     * The background of the navbar.
     */
    color: NavbarColor,
    /**
     * Up to which width of the screen an element without a collapse of its own is in the drawer.
     */
    collapse: NavCollapse,
    /**
     * The icon of the button that opens the drawer.
     */
    menuIcon: IconDefinition
};

/**
 * The values to change in the config of the navbar. Everything is optional, including every single label.
 */
export type NavbarConfigChanges = Partial<Omit<NavbarConfig, 'labels'>> & {
    /**
     * The texts to change.
     */
    labels?: Partial<NavbarLabels>
};
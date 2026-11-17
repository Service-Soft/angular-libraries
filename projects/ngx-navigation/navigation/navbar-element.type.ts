import { NavCollapse } from './nav-collapse.type';
import { NavElement } from './nav-element.type';

/**
 * Whether an element of the navbar moves into the drawer.
 */
type NavCollapsible = {
    /**
     * Up to which width of the screen the element is in the drawer instead of the navbar. The default comes from
     * provideNavbarConfig.
     */
    collapse?: NavCollapse
};

/**
 * An element of a row of the navbar.
 */
export type NavbarElement = NavElement & NavCollapsible;
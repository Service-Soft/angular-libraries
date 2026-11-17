import { NavbarElement } from './navbar-element.type';

/**
 * A row of the navbar, which usually has one.
 */
export type NavbarRow = {
    /**
     * The elements of the row.
     */
    elements: NavbarElement[]
};
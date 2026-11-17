import { NavElement } from '@service-soft/ngx-navigation/navigation';

/**
 * An element of a row, with the classes of the item around it, like ones that show it only from a width on.
 */
export type NavRowItem = {
    /**
     * The element.
     */
    element: NavElement,
    /**
     * The classes of the item around it.
     */
    classes: string
};
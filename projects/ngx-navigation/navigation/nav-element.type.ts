import { NavButton } from './nav-button.model';
import { NavCustom } from './nav-custom.model';
import { NavElementPosition } from './nav-element-position.type';
import { NavImage } from './nav-image.model';
import { NavLink } from './nav-link.model';
import { NavMenu } from './nav-menu.model';
import { NavText } from './nav-text.model';
import { NavTitle } from './nav-title.model';

/**
 * Where an element sits in its row.
 */
type NavPlacement = {
    /**
     * Where in the row the element is. At the start by default.
     */
    position?: NavElementPosition
};

/**
 * What an element of the navigation shows, one type of element each, without where it sits.
 */
export type NavElementContent = NavTitle | NavImage | NavLink | NavButton | NavMenu | NavText | NavCustom;

/**
 * An element of a row of the navbar or the footer.
 */
export type NavElement = NavElementContent & NavPlacement;
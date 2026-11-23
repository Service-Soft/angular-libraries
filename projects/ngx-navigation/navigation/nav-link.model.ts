import { ButtonColor, ButtonVariant } from '@service-soft/ui/button';
import { IconDefinition } from '@service-soft/ui/icon';

import { NavConditional } from './nav-conditional.model';
import { NavTarget } from './nav-target.type';

/**
 * A link, to a route of the app with `route` or to another site with `url`.
 */
export type NavLink = NavConditional & NavTarget & {
    /**
     * Says that it is a link.
     */
    type: 'link',
    /**
     * The text of the link.
     */
    name: string,
    /**
     * An icon in front of the name.
     */
    icon?: IconDefinition,
    /**
     * Draws the link as a button in a row of the navbar, like the call to action of a website. Without one, it is a
     * link. In the drawer and in menus it is always a link.
     */
    variant?: ButtonVariant,
    /**
     * The color of the button that variant draws, the one of `ui-button` by default.
     */
    color?: ButtonColor
};
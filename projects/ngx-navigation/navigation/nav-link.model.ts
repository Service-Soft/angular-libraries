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
    icon?: IconDefinition
};
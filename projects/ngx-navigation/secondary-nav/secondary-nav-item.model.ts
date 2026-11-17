import { NavLink, NavLinkView } from '@service-soft/ngx-navigation/navigation';

/**
 * A link of the secondary navigation with the attributes of its `<a>`.
 */
export type SecondaryNavItem = {
    /**
     * The link.
     */
    link: NavLink,
    /**
     * The attributes of its `<a>`.
     */
    view: NavLinkView
};
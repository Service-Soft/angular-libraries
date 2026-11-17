import { IconDefinition } from '@service-soft/ui/icon';

import { NavConditional } from './nav-conditional.model';
import { NavTarget } from './nav-target.type';

/**
 * The name of the app or the site, like at the start of the navbar.
 */
export type NavTitle = NavConditional & {
    /**
     * Says that it is a title.
     */
    type: 'title',
    /**
     * The text of the title.
     */
    title: string,
    /**
     * An icon in front of the title.
     */
    icon?: IconDefinition,
    /**
     * Where the title links to, like the start page. Text without a link when there is none.
     */
    link?: NavTarget
};
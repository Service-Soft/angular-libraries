import { ButtonVariant } from '@service-soft/ui/button';
import { IconDefinition } from '@service-soft/ui/icon';

import { NavConditional } from './nav-conditional.model';

/**
 * A button that does something, like logging out.
 */
export type NavButton = NavConditional & {
    /**
     * Says that it is a button.
     */
    type: 'button',
    /**
     * The text of the button.
     */
    name: string,
    /**
     * An icon in front of the name.
     */
    icon?: IconDefinition,
    /**
     * How much the button stands out in the navbar and the footer. Text by default.
     */
    variant?: ButtonVariant,
    /**
     * What clicking the button does. It runs in an injection context, so it can use inject().
     */
    action: () => unknown
};
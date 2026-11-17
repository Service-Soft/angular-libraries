import { DrawerColor } from './drawer-color.type';
import { DrawerSide } from './drawer-side.type';

/**
 * The values a drawer uses when its inputs are not set.
 */
export type DrawerConfig = {
    /**
     * The edge of the screen the drawer slides in from.
     */
    side: DrawerSide,
    /**
     * The background of the drawer, which its content follows.
     */
    color: DrawerColor,
    /**
     * Whether the drawer shows its label as a heading, with a button that closes it.
     */
    header: boolean,
    /**
     * The name of the button of the header that closes the drawer.
     */
    closeLabel: string
};
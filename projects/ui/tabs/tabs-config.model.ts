import { TabsColor } from './tabs-color.type';
import { TabsVariant } from './tabs-variant.type';

/**
 * The values tabs use when their inputs are not set.
 */
export type TabsConfig = {
    /**
     * How the tabs look.
     */
    variant: TabsVariant,
    /**
     * The color of the selected tab.
     */
    color: TabsColor
};
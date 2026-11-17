import { Tracking } from '@service-soft/ngx-tracking/consent';

/**
 * A tracking as the consent dialog shows it.
 */
export type ConsentOptionView = {
    /**
     * The tracking.
     */
    tracking: Tracking,
    /**
     * Whether its checkbox is checked.
     */
    checked: boolean
};
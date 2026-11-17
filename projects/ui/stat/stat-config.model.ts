import { StatColor } from './stat-color.type';

/**
 * The values a stat uses when its inputs are not set.
 */
export type StatConfig = {
    /**
     * The color of the number.
     */
    color: StatColor,
    /**
     * How the number is written, like with a number of fraction digits or as a compact '1.2K'.
     */
    format: Intl.NumberFormatOptions,
    /**
     * How long the number counts up, in milliseconds.
     */
    duration: number
};
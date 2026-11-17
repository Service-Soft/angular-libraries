import { StepsOrientation } from './steps-orientation.type';

/**
 * The values a list of steps uses when its inputs are not set.
 */
export type StepsConfig = {
    /**
     * How the steps follow each other.
     */
    orientation: StepsOrientation
};
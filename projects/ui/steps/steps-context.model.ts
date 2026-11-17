import { Signal } from '@angular/core';

import { StepsOrientation } from './steps-orientation.type';

/**
 * What a step reads from the list of steps it is in.
 */
export type StepsContext = {
    /**
     * How the steps follow each other.
     */
    orientation: Signal<StepsOrientation>,
    /**
     * The steps, in their order, which gives each one its number.
     */
    steps: Signal<readonly object[]>
};
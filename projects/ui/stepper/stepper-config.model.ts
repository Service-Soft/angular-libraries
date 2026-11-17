import { HeadingLevel } from '@service-soft/ui/heading';

import { StepperColor } from './stepper-color.type';
import { StepperOrientation } from './stepper-orientation.type';

/**
 * The values a stepper uses when its inputs are not set.
 */
export type StepperConfig = {
    /**
     * Whether the steps are in a row or below each other.
     */
    orientation: StepperOrientation,
    /**
     * Whether the user only moves with the buttons below the steps, or may also go back to a done step by its name.
     */
    linear: boolean,
    /**
     * The color of the done and the current steps.
     */
    color: StepperColor,
    /**
     * The level of the heading of the current step.
     */
    headingLevel: HeadingLevel,
    /**
     * What screen readers call the list of the steps.
     */
    label: string,
    /**
     * The text of the button that goes back to the step before.
     */
    backLabel: string,
    /**
     * The text of the button that checks the current step and goes on to the next one.
     */
    nextLabel: string,
    /**
     * The text of the button of the last step, which checks it and finishes.
     */
    finishLabel: string,
    /**
     * Read after the name of a done step by screen readers, which can't see its check mark.
     */
    doneLabel: string,
    /**
     * What screen readers call the spinner of the button that goes on, while the check of beforeNext runs.
     */
    busyLabel: string,
    /**
     * What a horizontal stepper shows in place of its steps where they don't fit, like 'Step 2 of 4'.
     */
    progressLabel: (current: number, total: number) => string
};
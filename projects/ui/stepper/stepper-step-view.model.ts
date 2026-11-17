import { StepComponent } from './step.component';
import { StepperStepState } from './stepper-step-state.type';

/**
 * A step of a stepper with what its header and panel show.
 */
export type StepperStepView = {
    /**
     * The step.
     */
    step: StepComponent,
    /**
     * Its position, from 0.
     */
    index: number,
    /**
     * Whether it is done, the current one or still to come.
     */
    state: StepperStepState,
    /**
     * Whether it is the first step, which has no button back.
     */
    isFirst: boolean,
    /**
     * Whether it is the last step, whose button finishes.
     */
    isLast: boolean,
    /**
     * Whether its name is a button that goes back to it.
     */
    isNavigable: boolean,
    /**
     * The id of its heading, which gets the focus when it becomes the current step.
     */
    headingId: string,
    /**
     * The tailwind classes of the circle with its number or check mark.
     */
    markerClasses: string,
    /**
     * The tailwind classes of its name in the list.
     */
    labelClasses: string,
    /**
     * The tailwind classes of the line to the next step.
     */
    connectorClasses: string
};
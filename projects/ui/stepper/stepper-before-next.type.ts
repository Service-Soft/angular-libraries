/**
 * A check a stepper runs once the controls of a step are valid, before it goes on, like whether the chosen car is still
 * available. It gets the index of the current step and says whether to go on, right away or once a request answered.
 * @param step - The index of the current step, from 0.
 * @returns Whether the stepper goes on, or finishes on the last step.
 */
export type StepperBeforeNext = (step: number) => boolean | Promise<boolean>;
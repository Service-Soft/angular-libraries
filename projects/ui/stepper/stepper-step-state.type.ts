/**
 * Where a step of a stepper is: done, before the current one, the current one, or still to come.
 */
export type StepperStepState = 'done' | 'current' | 'upcoming';
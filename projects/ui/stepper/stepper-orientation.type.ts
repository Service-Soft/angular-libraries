/**
 * How a stepper lays out its steps: in a row above the content of the current one, which becomes "Step 2 of 4" when
 * there is no room for the row, or below each other, with the content of the current step below its name.
 */
export type StepperOrientation = 'horizontal' | 'vertical';
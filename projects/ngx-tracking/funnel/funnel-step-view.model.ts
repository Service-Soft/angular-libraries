/**
 * A step of the funnel as the funnel component shows it.
 */
export type FunnelStepView = {
    /**
     * The name of the step.
     */
    name: string,
    /**
     * How often the step was reached.
     */
    value: number,
    /**
     * The share of the first step, formatted as a percentage.
     */
    percent: string,
    /**
     * The width of its shape, as a css percentage.
     */
    width: string,
    /**
     * The css clip-path that narrows its shape towards the next step, or undefined for the last one.
     */
    clipPath?: string
};
/**
 * A step of a funnel, like the visitors who put something in the cart.
 */
export type FunnelPoint = {
    /**
     * The name of the step, like 'Visit', 'Add to cart' or 'Purchase'.
     */
    name: string,
    /**
     * How often the step was reached.
     */
    value: number
};
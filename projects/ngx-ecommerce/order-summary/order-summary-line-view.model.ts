/**
 * An item of an order summary, ready to render.
 */
export type OrderSummaryLineView = {
    /**
     * What it is.
     */
    label: string,
    /**
     * More about it, shown in the detailed variant.
     */
    description: string | undefined,
    /**
     * The quantity, written in the language of the app.
     */
    quantity: string,
    /**
     * The price of one, in the currency.
     */
    unitPrice: string,
    /**
     * The quantity times the price of one, in the currency.
     */
    total: string
};
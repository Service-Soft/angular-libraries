/**
 * A row below the items of an order summary, like the subtotal or a tax, ready to render.
 */
export type OrderSummaryRowView = {
    /**
     * What the amount is, like 'Subtotal'.
     */
    label: string,
    /**
     * The amount, in the currency.
     */
    amount: string,
    /**
     * The tailwind classes of the row, which set the total and the notes, like the included tax, apart.
     */
    classes: string
};
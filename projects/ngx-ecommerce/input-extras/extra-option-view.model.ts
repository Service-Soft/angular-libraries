import { ExtraOption } from './extra-option.model';

/**
 * An option of an extras input with the ids, texts and state of its card, ready to render.
 */
export type ExtraOptionView = {
    /**
     * The option.
     */
    option: ExtraOption,
    /**
     * The id of the native checkbox or number input of the card.
     */
    id: string,
    /**
     * The id of the title, which names the native element.
     */
    titleId: string,
    /**
     * The id of the description.
     */
    descriptionId: string,
    /**
     * The id of the price, which describes the native element.
     */
    priceId: string,
    /**
     * The id of the validation error of a quantity.
     */
    errorId: string,
    /**
     * The ids of what describes the native element: the description, the price and the error, while it shows.
     */
    describedBy: string,
    /**
     * How many of it are chosen, 0 while it isn't.
     */
    quantity: number,
    /**
     * The min of the native number input: 0 while the extra isn't chosen, its min once it is.
     */
    nativeMin: number,
    /**
     * Whether it is chosen.
     */
    selected: boolean,
    /**
     * Whether it can't be changed, because it or the input is disabled.
     */
    disabled: boolean,
    /**
     * Whether its quantity can be lowered by one.
     */
    canDecrease: boolean,
    /**
     * Whether its quantity can be raised by one.
     */
    canIncrease: boolean,
    /**
     * The price, in the currency.
     */
    price: string,
    /**
     * What the price is for, like 'per day'.
     */
    unit: string,
    /**
     * The validation error of its quantity, while it shows.
     */
    error: string | undefined,
    /**
     * Whether its native element is marked invalid, for its own error or the one of the whole input.
     */
    invalid: boolean
};
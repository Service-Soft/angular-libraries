import { InputCardOption } from './input-card-option.model';

/**
 * An option of a cards input with the ids of its card.
 */
export type InputCardView<T> = {
    /**
     * The option.
     */
    option: InputCardOption<T>,
    /**
     * The id of the native radio button or checkbox of the card.
     */
    id: string,
    /**
     * Whether the option is chosen.
     */
    chosen: boolean,
    /**
     * Whether the option can't be chosen, because it or the input is disabled.
     */
    disabled: boolean,
    /**
     * The id of the title, which names the native element.
     */
    titleId: string,
    /**
     * The ids of the description and the meta, which describe the native element, undefined when the card has neither.
     */
    describedBy: string | undefined,
    /**
     * The id of the description.
     */
    descriptionId: string,
    /**
     * The id of the meta.
     */
    metaId: string
};
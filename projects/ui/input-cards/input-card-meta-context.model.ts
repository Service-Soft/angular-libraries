import { InputCardOption } from './input-card-option.model';

/**
 * What the template of the meta of an option card gets: the option, as `let-option`.
 */
export type InputCardMetaContext<T> = {
    /**
     * The option of the card.
     */
    $implicit: InputCardOption<T>
};
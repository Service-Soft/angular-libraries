import { BasePropertyMetadata, BasePropertyMetadataInput } from './base-property-metadata.model';

/**
 * The formats of a string, like in zibri. `phone` is a number in international format, like '+4915112345678'.
 */
export type StringFormat = 'uuid' | 'email' | 'phone';

/**
 * How the field of a string shows: one line, several for a longer text, or one line that suggests its options. A string
 * with an enum is a select.
 */
export type StringDisplayStyle = 'line' | 'textarea' | 'autocomplete';

/**
 * The texts the field of a string suggests: a list, or a function of the entity that resolves it.
 */
export type StringOptions<T> = string[] | ((entity: Partial<T>) => string[]);

/**
 * What a string property says about itself, with every value set.
 */
export type StringPropertyMetadata<T> = BasePropertyMetadata<T, string> & {
    /**
     * The kind of the property.
     */
    type: 'string',
    /**
     * How the field shows.
     */
    displayStyle: StringDisplayStyle,
    /**
     * The format of the value, if it has one.
     */
    format: StringFormat | undefined,
    /**
     * The least number of characters.
     */
    minLength: number | undefined,
    /**
     * The most number of characters.
     */
    maxLength: number | undefined,
    /**
     * A pattern the whole value has to match.
     */
    regex: RegExp | string | undefined,
    /**
     * The enum the value is one of, which makes the field a select of its values.
     */
    enum: Record<string, string> | undefined,
    /**
     * The texts the field suggests while the user types, with the display style 'autocomplete'.
     */
    options: StringOptions<T> | undefined,
    /**
     * Whether only the options can be the value, nothing else the user types.
     */
    restrictToOptions: boolean,
    /**
     * Whether the value is a password, like zibri's password strings: the field hides it, the form of an existing entity
     * starts empty and keeps the stored one while it stays empty, and the entity read from the server never has it.
     */
    password: boolean,
    /**
     * Whether a password is typed a second time, which has to match. Only sent once.
     */
    confirmation: boolean,
    /**
     * The label of the field that repeats a password, else the one of the config of the password field.
     */
    confirmationDisplayName: string | undefined,
    /**
     * Whether the field of a password shows how hard it is to guess.
     */
    passwordStrength: boolean
};

/**
 * What a string property says about itself: its label, and every other value that differs from its default.
 */
export type StringPropertyMetadataInput<T> = BasePropertyMetadataInput<T, string>
    & Partial<Omit<StringPropertyMetadata<T>, keyof BasePropertyMetadata<T, string> | 'type'>>;
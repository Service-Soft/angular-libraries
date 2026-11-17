import { EntityClass } from './entity-class.type';

/**
 * What the objects of an array say about themselves, with every value set, like the positions of an invoice: they show
 * in a table, and are added and edited in a dialog with the fields of their class.
 */
export type ObjectArrayItemMetadata = {
    /**
     * The kind of the items.
     */
    type: 'object',
    /**
     * The class whose decorators describe the properties of the objects.
     */
    cls: () => EntityClass<object>,
    /**
     * The properties the table shows, by their keys, else every one the form displays.
     */
    columns: string[] | undefined
};

/**
 * What the objects of an array say about themselves: their class, and every other value that differs from its default.
 */
export type ObjectArrayItemMetadataInput<O> = {
    /**
     * The kind of the items.
     */
    type: 'object',
    /**
     * The class whose decorators describe the properties of the objects, in a function, like zibri's.
     */
    cls: () => EntityClass<O>,
    /**
     * The properties the table shows, by their keys, else every one the form displays.
     */
    columns?: (keyof O & string)[]
};
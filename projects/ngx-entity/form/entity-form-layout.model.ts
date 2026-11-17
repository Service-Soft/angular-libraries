import { EntityProperty } from '@service-soft/ngx-entity/entity';

/**
 * A field of an entity form, with what it shows right now.
 */
export type EntityFormField<T> = {
    /**
     * The property of the field.
     */
    property: EntityProperty<T>,
    /**
     * The path of the value the field edits: the joinColumn of a relation to one entity, else the key of the property,
     * after the path of the object it is in, like 'address.city'. The problems of the server have the same keys.
     */
    valueKey: string,
    /**
     * The path of the object the property is in, whose values its conditions get, or undefined for the entity itself.
     */
    path: string | undefined,
    /**
     * The tailwind classes of the columns it takes on each screen size.
     */
    classes: string,
    /**
     * Whether it needs a value.
     */
    required: boolean,
    /**
     * Whether it can't be changed.
     */
    readonly: boolean,
    /**
     * The rows of the properties of an inline object, which take the place of a field of their own.
     */
    rows: EntityFormRow<object>[] | undefined
};

/**
 * A row of an entity form, 12 columns wide.
 */
export type EntityFormRow<T> = {
    /**
     * What identifies the row inside its tab.
     */
    key: string,
    /**
     * The fields, in order.
     */
    fields: EntityFormField<T>[]
};

/**
 * A tab of an entity form.
 */
export type EntityFormTab<T> = {
    /**
     * The number of the tab, from 1 on.
     */
    tab: number,
    /**
     * The label of the tab.
     */
    label: string,
    /**
     * The rows, in order.
     */
    rows: EntityFormRow<T>[]
};
/**
 * A value the user changed in an entity form.
 */
export type EntityFormChange = {
    /**
     * The name of the property.
     */
    key: string,
    /**
     * Its new value.
     */
    value: unknown
};
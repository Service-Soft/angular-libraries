/**
 * A change as the change sets component shows it.
 */
export type ChangeView = {
    /**
     * The name of the property that changed.
     */
    key: string,
    /**
     * The value before the change, formatted for reading.
     */
    previousValue: string,
    /**
     * The value after the change, formatted for reading.
     */
    newValue: string
};
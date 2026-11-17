/**
 * The texts of the tables of arrays of dates, date ranges and objects in entity forms.
 */
export type EntityArrayFieldConfig = {
    /**
     * The button that adds an item.
     */
    addLabel: string,
    /**
     * The buttons that edit an object, read together with its first value.
     */
    editLabel: string,
    /**
     * The buttons that remove an item, read together with its text.
     */
    removeLabel: string,
    /**
     * The header of the column of the dates, and the label of the input of a new one.
     */
    dateLabel: string,
    /**
     * The header of the column of the starts of date ranges, and the label of the input of a new one.
     */
    startLabel: string,
    /**
     * The header of the column of the ends of date ranges, and the label of the input of a new one.
     */
    endLabel: string,
    /**
     * The heading of the dialog that adds an object, from the label of the array.
     */
    addTitle: (displayName: string) => string,
    /**
     * The heading of the dialog that edits an object, from the label of the array.
     */
    editTitle: (displayName: string) => string,
    /**
     * The button of the dialog that takes the object.
     */
    saveLabel: string,
    /**
     * The button of the dialog that leaves it without taking it.
     */
    cancelLabel: string,
    /**
     * The text of true in the table of objects.
     */
    yesLabel: string,
    /**
     * The text of false in the table of objects.
     */
    noLabel: string
};
/**
 * The texts of the question before changes are lost.
 */
export type UnsavedChangesConfig = {
    /**
     * The question.
     */
    title: string,
    /**
     * The text below it.
     */
    paragraphs: string[],
    /**
     * The button that leaves and loses the changes.
     */
    discardLabel: string,
    /**
     * The button that goes back to the changes.
     */
    keepEditingLabel: string
};
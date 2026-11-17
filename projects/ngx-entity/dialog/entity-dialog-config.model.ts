/**
 * The texts of the question before deleting an entity. The texts of the dialogs that create and edit entities come from
 * provideEntityFormConfig.
 */
export type EntityDialogConfig = {
    /**
     * The question before deleting an entity, unless it is asked with a title.
     */
    deleteTitle: string,
    /**
     * The text below that question.
     */
    deleteParagraphs: string[],
    /**
     * The button that deletes.
     */
    deleteLabel: string,
    /**
     * The button that keeps the entity.
     */
    keepLabel: string
};
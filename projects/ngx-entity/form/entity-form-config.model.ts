/**
 * The texts of entity forms, and of the dialogs and pages they are in.
 */
export type EntityFormConfig = {
    /**
     * The label of a tab none of whose properties names it with `position.tabName`.
     */
    tabLabel: (tab: number) => string,
    /**
     * The heading of a dialog or page that creates an entity, unless it has a title of its own.
     */
    createTitle: string,
    /**
     * The heading of a dialog or page that edits an entity, unless it has a title of its own.
     */
    editTitle: string,
    /**
     * The button that saves.
     */
    saveLabel: string,
    /**
     * The button that leaves without saving.
     */
    cancelLabel: string
};
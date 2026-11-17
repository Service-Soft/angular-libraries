/**
 * The titles of the pages of an entity, which are their headings and the titles of their tabs, like 'New task'. By
 * default the headings come from provideEntityFormConfig, and the titles of the tabs stay as they are.
 */
export type EntityRouteOptions = {
    /**
     * The title of the page that creates an entity.
     */
    createTitle?: string,
    /**
     * The title of the page that edits an entity.
     */
    editTitle?: string
};
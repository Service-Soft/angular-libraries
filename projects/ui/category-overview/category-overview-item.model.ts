/**
 * An item of a category overview, like a treatment of a dental practice.
 */
export type CategoryOverviewItem = {
    /**
     * What it is called, like 'Professional teeth cleaning'.
     */
    title: string,
    /**
     * What it is, below the title.
     */
    text?: string
};
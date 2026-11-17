/**
 * The texts of a gallery, for screen readers.
 */
export type GalleryConfig = {
    /**
     * The name of the dialog that shows a picture large.
     */
    label: string,
    /**
     * The name of the button that shows the picture before.
     */
    previousLabel: string,
    /**
     * The name of the button that shows the picture after.
     */
    nextLabel: string,
    /**
     * The name of the button that closes the dialog.
     */
    closeLabel: string,
    /**
     * What screen readers read when a picture shows, before its alt, like 'Picture 3 of 12'.
     */
    positionLabel: (position: number, count: number) => string
};
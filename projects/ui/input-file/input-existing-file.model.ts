/**
 * A file the backend stored already, which a file input shows next to the ones the user chooses, like the StoredFile
 * of zibri-contract.
 */
export type InputExistingFile = {
    /**
     * The name of the file, like 'invoice.pdf'.
     */
    name: string,
    /**
     * Where a browser loads the file from, which shows the preview of an image.
     */
    url: string,
    /**
     * The mime type of the file, like 'image/png', which says whether it gets a preview.
     */
    mimeType?: string,
    /**
     * The size of the file in bytes, shown next to its name.
     */
    size?: number
};
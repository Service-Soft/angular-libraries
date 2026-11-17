import { InputFileValue } from './input-file-value.type';

/**
 * A file of a file input, as its list shows it.
 */
export type InputFileView = {
    /**
     * The file.
     */
    file: InputFileValue,
    /**
     * Its name.
     */
    name: string,
    /**
     * Its size as people read it, like '1.5 MB', if it is known.
     */
    size: string | undefined,
    /**
     * Where its preview loads from, for an image.
     */
    previewUrl: string | undefined,
    /**
     * Why the file can't be uploaded, like being too large, while the errors of the input show.
     */
    error: string | undefined,
    /**
     * The tailwind classes of its entry, which marks it while it has an error.
     */
    classes: string,
    /**
     * The id of its name, which describes the button that removes it.
     */
    nameId: string,
    /**
     * The id of its error.
     */
    errorId: string,
    /**
     * The ids of its name and of its error while it has one, which describe the button that removes it.
     */
    describedBy: string
};
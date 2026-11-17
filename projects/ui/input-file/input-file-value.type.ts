import { InputExistingFile } from './input-existing-file.model';

/**
 * A file of a file input: a File the user chose, or one the backend stored already.
 */
export type InputFileValue = File | InputExistingFile;
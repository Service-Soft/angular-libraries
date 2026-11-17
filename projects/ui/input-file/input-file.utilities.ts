import { InputFileValue } from './input-file-value.type';

// the units of a size, from bytes on, each 1000 times the one before, like the size the file manager shows.
const SIZE_UNITS: string[] = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];

/**
 * Checks the files of a file input.
 */
export abstract class InputFileUtilities {
    /**
     * Whether a file is of a type the native accept attribute names: a mime type like 'application/pdf', a group like
     * 'image/*', or an extension like '.pdf'.
     * @param file - The file.
     * @param accept - The accept attribute, or undefined for every file.
     * @returns Whether it is accepted.
     */
    // the picker of the browser offers only these types, but lets the user pick every file anyway.
    static isAccepted(file: File, accept: string | undefined): boolean {
        if (accept == undefined || accept.trim() === '') {
            return true;
        }
        const name: string = file.name.toLowerCase();
        const type: string = file.type.toLowerCase();
        const entries: string[] = accept.split(',').map(entry => entry.trim().toLowerCase());
        return entries.some(entry => {
            if (entry.startsWith('.')) {
                return name.endsWith(entry);
            }
            return entry.endsWith('/*') ? type.startsWith(entry.slice(0, -1)) : type === entry;
        });
    }

    /**
     * Whether a file is an image, which a file input shows a preview of.
     * @param file - The file.
     * @returns Whether its mime type is the one of an image.
     */
    static isImage(file: InputFileValue): boolean {
        return (file instanceof File ? file.type : file.mimeType ?? '').startsWith('image/');
    }

    /**
     * Gets the size of a file as people read it, like '1.5 MB'.
     * @param bytes - The size in bytes.
     * @param locale - The locale to write the number in.
     * @returns The size in the largest unit it has at least one of.
     */
    static getReadableSize(bytes: number, locale: string): string {
        let unit: number = 0;
        let size: number = bytes;
        while (size >= 1000 && unit < SIZE_UNITS.length - 1) {
            size /= 1000;
            unit++;
        }
        return new Intl.NumberFormat(locale, { style: 'unit', unit: SIZE_UNITS[unit], maximumFractionDigits: 1 }).format(size);
    }
}
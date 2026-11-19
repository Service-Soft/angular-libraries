/**
 * Utilities for avatars.
 */
export abstract class AvatarUtilities {
    /**
     * Resolves the initials of a name: the first letter of its first and of its last word, like 'AL' for 'Ada King
     * Lovelace', or one letter for a name of one word.
     * @param name - The name.
     * @param locale - The language the letters are uppercased in, like 'tr', where 'i' becomes 'İ'.
     * @returns The initials, empty for a name without words.
     */
    static resolveInitials(name: string, locale: string): string {
        const words: string[] = name.trim()
            .split(/\s+/)
            .filter(word => word !== '');
        const first: string | undefined = words.at(0);
        const last: string | undefined = words.length > 1 ? words.at(-1) : undefined;
        return [first, last]
            .map(word => this.getFirstLetter(word))
            .join('')
            .toLocaleUpperCase(locale);
    }

    // by code points, so a letter outside of the basic plane, which takes two utf-16 units, isn't cut in half.
    private static getFirstLetter(word: string | undefined): string {
        return word == undefined ? '' : Array.from(word)[0] ?? '';
    }
}
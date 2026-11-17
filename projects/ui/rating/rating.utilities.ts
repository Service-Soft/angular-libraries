// the space between two stars, in em like the stars themselves, which are 1em wide.
const STAR_GAP: number = 0.125;

/**
 * Utilities for ratings.
 */
export abstract class RatingUtilities {
    /**
     * Writes a value of a rating with one decimal, the way rating sites show it, like '4.4' or '5.0'.
     * @param value - The value.
     * @param locale - The language it is written in, like 'de', where it is '4,4'.
     * @returns The value as text.
     */
    static formatValue(value: number, locale: string): string {
        return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
    }

    /**
     * Calculates how wide the filled stars of a value are, from the start of the first star.
     * @param value - The value, which is limited to between 0 and max.
     * @param max - How many stars there are.
     * @returns The width in em, the full stars with the gaps after them, and the part of the last one.
     */
    static calculateFillWidth(value: number, max: number): number {
        const limited: number = Math.min(Math.max(value, 0), max);
        const fullStars: number = Math.floor(limited);
        return (fullStars * (1 + STAR_GAP)) + (limited - fullStars);
    }
}
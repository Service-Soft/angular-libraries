/**
 * The elements of a row, by where in the row they are.
 */
export type NavPositionGroups<T> = {
    /**
     * The elements at the start of the row.
     */
    start: T[],
    /**
     * The elements in the center of the row.
     */
    center: T[],
    /**
     * The elements at the end of the row.
     */
    end: T[]
};
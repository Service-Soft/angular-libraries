/**
 * The tailwind classes of the cells of ui-table. On a phone every row is a card of its values, each after the label of
 * its column, and the header only offers the columns to order by.
 */
export const TABLE_CELL_CLASSES: Record<'start' | 'end', string> = {
    start: 'px-3 py-2 text-start align-middle text-body text-on-surface max-sm:flex max-sm:gap-3 max-sm:px-0 max-sm:py-1',
    end: `
        px-3 py-2 text-end align-middle text-body text-on-surface tabular-nums
        max-sm:flex max-sm:gap-3 max-sm:px-0 max-sm:py-1 max-sm:text-start
    `
};

/**
 * The tailwind classes of the label of a column a cell shows before its value on a phone, where the header row doesn't
 * show above it.
 */
export const TABLE_PHONE_LABEL_CLASSES: string = 'hidden min-w-24 font-semibold max-sm:inline';

/**
 * The tailwind classes of the checkboxes that select rows. The focus ring is offset from the box, so it never depends
 * on its color.
 */
export const TABLE_CHECKBOX_CLASSES: string = `
    size-4 cursor-pointer accent-primary
    disabled:cursor-default
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
`;
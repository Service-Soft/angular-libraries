/**
 * The tailwind classes of the list of options an input opens below itself, like an autocomplete: as wide as the input
 * and styled like the menu. It scrolls once it is longer than a few options. It is a popover, see InputPopupDirective,
 * which the browser places in the middle of the page with a border and padding: inset-auto and the margins undo that,
 * position-area puts it below the input and flips it above when there is no space. Its options are inset from its edge.
 */
export const INPUT_POPUP_CLASSES: string = `
    inset-auto mx-0 my-1 max-h-64 [width:anchor-size(width)] overflow-y-auto rounded-menu border border-outline-variant bg-surface px-1 py-1
    text-on-surface shadow-2 [position-area:block-end_span-inline-end] [position-try-fallbacks:flip-block]
`;

/**
 * The tailwind classes of an option in that list, like an item of the menu. Focus stays in the input, so a bar at the
 * start of the option shows which one the keyboard is on. A group, so what is inside it can show whether it is selected.
 */
// the background alone is too close to the surface to show where the keyboard is, the bar in primary has the contrast of
// a focus ring. It is a border, not a background, so it survives forced colors mode, and only exists on the active
// option, because forced colors would draw a transparent border as well.
export const INPUT_OPTION_CLASSES: string = `
    group relative flex min-h-10 cursor-pointer items-center gap-3 rounded-link px-4 py-2 text-body text-on-surface
    hover:not-aria-disabled:bg-surface-container
    data-[active=true]:bg-surface-container
    data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:start-0
    data-[active=true]:before:rounded-full data-[active=true]:before:border-s-[3px] data-[active=true]:before:border-primary
    aria-selected:font-semibold
    aria-disabled:cursor-default aria-disabled:opacity-50
`;
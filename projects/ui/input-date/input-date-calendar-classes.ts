import { InputCalendarColor } from '@service-soft/ui/input';

/**
 * The tailwind classes of the strip across the top of a calendar, with its month and the buttons to the months before
 * and after it. Add the classes of its color.
 */
// a strip across the top of the popover, which has no padding, and whose overflow clips the strip to its rounded
// corners.
export const INPUT_DATE_CALENDAR_HEADER_CLASSES: string = 'flex items-center justify-between gap-2 px-3 py-2';

/**
 * The tailwind classes of the color of the strip across the top of a calendar.
 */
// a theme color puts its on- colors in place of the surface tokens of the buttons inside, so the month and the arrows
// keep their contrast, hover and focus ring on it.
export const INPUT_DATE_CALENDAR_HEADER_COLOR_CLASSES: Record<InputCalendarColor, string> = {
    neutral: '',
    primary: 'surface-primary',
    secondary: 'surface-secondary'
};

/**
 * The tailwind classes of a cell of a grid of a calendar, around the shape that shows its day, year or month.
 */
// the cell is what the grid focuses, the circle inside of it shows the day: preflight collapses the borders of tables,
// which ignores the radius of a cell. So the cell shows nothing itself, and the circle shows its hover and focus.
export const INPUT_DATE_CALENDAR_CELL_CLASSES: string = 'group cursor-pointer p-0.5 outline-none aria-disabled:pointer-events-none';

/**
 * The tailwind classes of the circle that shows a day of a calendar. Add the classes of its state. Inside a cell with
 * the class group, it shows the hover and focus of the cell.
 */
// w-fit and mx-auto keep the circle round and centered when the calendar is wider than its days, like a wide input.
export const INPUT_DATE_CALENDAR_DAY_CLASSES: string = `
    mx-auto flex min-h-9 w-fit min-w-9 items-center justify-center rounded-full text-body transition-colors
    group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary
    group-aria-disabled:opacity-50
`;

/**
 * The tailwind classes of the circle of a day of a calendar, by its state: chosen, between the start and the end of a
 * range, in the month that shows, or in the month before or after it.
 */
// the days of the months before and after only fill the weeks, so they are less prominent. The chosen day is filled,
// with a transparent border that keeps its shape in forced colors mode, and bold, so color isn't the only cue. The days
// between the start and the end of a range are tinted, as primary text on its tint, whose pair is checked, and bold as
// well, like the chosen ones.
export const INPUT_DATE_CALENDAR_DAY_STATE_CLASSES: Record<'selected' | 'inRange' | 'inMonth' | 'outsideMonth', string> = {
    selected: 'border border-transparent bg-primary font-semibold text-on-primary group-hover:bg-primary-hover',
    inRange: 'bg-primary-tint font-semibold text-primary group-hover:bg-primary-tint-pressed',
    inMonth: 'text-on-surface group-hover:bg-surface-container',
    outsideMonth: 'text-on-surface-variant group-hover:bg-surface-container'
};

/**
 * The tailwind classes of the circle of today in a calendar, unless it is chosen.
 */
// a ring, so today is not only told by its color. Not on the chosen day, whose fill already shows it.
export const INPUT_DATE_CALENDAR_TODAY_CLASSES: string = 'border border-primary';

/**
 * The tailwind classes of the button inside a date input that opens its calendar: an icon at the end of the input,
 * which the input leaves room for with pe-11.
 */
// an icon inside the input rather than a text button, whose fill on hover would cover the border of the input. Hover
// only darkens the icon, both colors are checked on the surface. The icon is sized in em, so it grows with the text.
export const INPUT_DATE_CALENDAR_BUTTON_CLASSES: string = `
    absolute inset-y-0 inset-e-2 my-auto flex min-h-7 min-w-7 cursor-pointer items-center justify-center rounded-full text-body
    text-on-surface-variant transition-colors
    hover:text-on-surface
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
    disabled:pointer-events-none disabled:opacity-50
    [&_svg]:size-[1em]
`;

/**
 * The tailwind classes of the popover of the calendar of a date input, placed below its anchor and as wide as it, up
 * to 24rem.
 */
// placed like the popover: the browser places a popover in the middle of the page with a border and padding.
// inset-auto and the margins undo that, position-area puts it below the input, starting at its start edge, and the
// fallbacks flip it above or to the other side when it doesn't fit. It is as wide as the input, so their edges line
// up, but no wider than 24rem, where the days would only spread out. min-w-fit wins over the max-w and lets it grow
// when its days don't fit, like in a narrow input or with larger text. The width doesn't depend on its content, so it
// keeps it when it switches between days, years and months. anchor-size() stands on its own like in the listbox of the
// select: wrapped in min(), the calendar fell back to the width of its content. No padding, the calendar pads its
// content itself, so its header reaches the edges.
export const INPUT_DATE_CALENDAR_CLASSES: string = `
    inset-auto mx-0 my-1 rounded-popover bg-surface p-0 text-on-surface shadow-2 [position-area:block-end_span-inline-end]
    [position-try-fallbacks:flip-block,flip-inline] w-[anchor-size(width)] max-w-96 min-w-fit
`;

/**
 * The tailwind classes of the border of that popover, by the color of the header of the calendar.
 */
// the background reaches under the border, so even a transparent one would show a line of the surface around a colored
// header. A colored calendar has none then, its shadow sets it apart, and forced colors mode, which removes shadows and
// backgrounds, gets the border back to keep its shape.
export const INPUT_DATE_CALENDAR_BORDER_CLASSES: Record<InputCalendarColor, string> = {
    neutral: 'border border-outline-variant',
    primary: 'border-0 forced-colors:border',
    secondary: 'border-0 forced-colors:border'
};
import { InputColor } from './input-color.type';

/**
 * The tailwind classes of a native checkbox drawn as a box, like the one of ui-input-boolean. Its border keeps the shape
 * in forced colors mode, where backgrounds are gone, and turns to the error color while it is invalid. A peer, so a mark
 * after it can follow its state. Add the focus ring and the hover of a checkbox that stands alone, or leave them to the
 * card around it.
 */
export const INPUT_CHECKBOX_CLASSES: string = `
    peer size-5 shrink-0 cursor-pointer appearance-none rounded-sm border-2 border-outline bg-surface transition-colors
    disabled:cursor-default
    aria-invalid:border-error
`;

/**
 * The tailwind classes of a checked or partly checked box in each color.
 */
// the color fills the box, which hovers with its -hover, under a mark in its on- color: checked pairs. Neutral is
// on-surface, hovering with on-surface-variant, under a mark in the surface color, the reverse of checked pairs.
// secondary is too light for the boundary of a control, so its border is secondary-text.
export const INPUT_CHECKBOX_COLOR_CLASSES: Record<InputColor, string> = {
    neutral: `
        checked:border-on-surface checked:bg-on-surface
        indeterminate:border-on-surface indeterminate:bg-on-surface
        checked:hover:border-on-surface-variant checked:hover:bg-on-surface-variant
        indeterminate:hover:border-on-surface-variant indeterminate:hover:bg-on-surface-variant
    `,
    primary: `
        checked:border-primary checked:bg-primary
        indeterminate:border-primary indeterminate:bg-primary
        checked:hover:border-primary-hover checked:hover:bg-primary-hover
        indeterminate:hover:border-primary-hover indeterminate:hover:bg-primary-hover
    `,
    secondary: `
        checked:border-secondary-text checked:bg-secondary
        indeterminate:border-secondary-text indeterminate:bg-secondary
        checked:hover:border-secondary-text checked:hover:bg-secondary-hover
        indeterminate:hover:border-secondary-text indeterminate:hover:bg-secondary-hover
    `,
    success: `
        checked:border-success checked:bg-success
        indeterminate:border-success indeterminate:bg-success
        checked:hover:border-success-hover checked:hover:bg-success-hover
        indeterminate:hover:border-success-hover indeterminate:hover:bg-success-hover
    `
};

/**
 * The tailwind classes of the check mark and the dash over the box, right after the checkbox inside a relative box.
 */
// they follow the state of the native checkbox, not the value, so they never lag behind a click. Partly checked shows
// the dash even while checked.
export const INPUT_CHECKBOX_MARK_CLASSES: Record<'checked' | 'indeterminate', string> = {
    checked: `
        pointer-events-none absolute inset-0 hidden items-center justify-center
        [&_svg]:size-3
        peer-checked:flex
        peer-indeterminate:hidden
    `,
    indeterminate: 'pointer-events-none absolute inset-0 hidden items-center justify-center [&_svg]:size-3 peer-indeterminate:flex'
};

/**
 * The tailwind classes of the color of the marks, the on- color of the fill of the box.
 */
export const INPUT_CHECKBOX_MARK_COLOR_CLASSES: Record<InputColor, string> = {
    neutral: 'text-surface',
    primary: 'text-on-primary',
    secondary: 'text-on-secondary',
    success: 'text-on-success'
};

/**
 * The tailwind classes of a native checkbox drawn as the track of a switch, like the one of ui-input-boolean. Its
 * border keeps the shape in forced colors mode. A peer, so the thumb after it can follow its state. Add the focus ring
 * and the hover of a switch that stands alone, or leave them to the card around it.
 */
export const INPUT_SWITCH_CLASSES: string = `
    peer h-6 w-10 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-outline bg-surface transition-colors
    disabled:cursor-default
    aria-invalid:border-error
`;

/**
 * The tailwind classes of a switch that is on, in each color: like a checked box, under a thumb in the on- color.
 */
export const INPUT_SWITCH_COLOR_CLASSES: Record<InputColor, string> = {
    neutral: 'checked:border-on-surface checked:bg-on-surface checked:hover:border-on-surface-variant checked:hover:bg-on-surface-variant',
    primary: 'checked:border-primary checked:bg-primary checked:hover:border-primary-hover checked:hover:bg-primary-hover',
    secondary: 'checked:border-secondary-text checked:bg-secondary checked:hover:border-secondary-text checked:hover:bg-secondary-hover',
    success: 'checked:border-success checked:bg-success checked:hover:border-success-hover checked:hover:bg-success-hover'
};

/**
 * The tailwind classes of the thumb of a switch in each color, right after the checkbox inside a relative box.
 */
// it moves to the end while on, to the left in a right to left page. Moving is movement, so only with motion-safe. Its
// border keeps it visible in forced colors mode.
export const INPUT_SWITCH_THUMB_CLASSES: Record<InputColor, string> = {
    neutral: `
        pointer-events-none absolute start-1 top-1 size-4 rounded-full border-2 border-transparent bg-outline
        motion-safe:transition-transform
        peer-checked:translate-x-4 peer-checked:bg-surface
        rtl:peer-checked:-translate-x-4
    `,
    primary: `
        pointer-events-none absolute start-1 top-1 size-4 rounded-full border-2 border-transparent bg-outline
        motion-safe:transition-transform
        peer-checked:translate-x-4 peer-checked:bg-on-primary
        rtl:peer-checked:-translate-x-4
    `,
    secondary: `
        pointer-events-none absolute start-1 top-1 size-4 rounded-full border-2 border-transparent bg-outline
        motion-safe:transition-transform
        peer-checked:translate-x-4 peer-checked:bg-on-secondary
        rtl:peer-checked:-translate-x-4
    `,
    success: `
        pointer-events-none absolute start-1 top-1 size-4 rounded-full border-2 border-transparent bg-outline
        motion-safe:transition-transform
        peer-checked:translate-x-4 peer-checked:bg-on-success
        rtl:peer-checked:-translate-x-4
    `
};

/**
 * The tailwind classes of a card to choose, like an option of ui-input-cards. Mark it with `data-selected="true"` while
 * it is chosen and `data-disabled="true"` while it can't be, and add the display it needs.
 */
// its border is decorative, the native element in it is the boundary of the control, so it may be outline-variant. Only
// its color changes with the state, never its thickness, so choosing one doesn't move the cards.
export const INPUT_CARD_CLASSES: string = `
    rounded-input-card border-2 border-outline-variant text-on-surface transition-colors
    data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50
`;

/**
 * The tailwind classes of a card that is a label around its native element, editable or read only.
 */
// a click anywhere on the label chooses it, and hovering sets it apart with the container color, which holds the same
// texts. Read only it has the container color, like the other inputs. The focus ring is around the whole card, as the
// native element inside is small; it is offset, so it never depends on the color of the border.
export const INPUT_CARD_LABEL_CLASSES: Record<'editable' | 'readonly', string> = {
    editable: 'cursor-pointer bg-surface hover:bg-surface-container has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
    readonly: 'cursor-default bg-surface-container has-focus-visible:outline-2 has-focus-visible:outline-offset-2'
};

/**
 * The tailwind classes of the border of a chosen card and of the focus ring around a card, in each color.
 */
// besides the marked native element, so the color is never the only cue. Like outlined buttons, secondary and success
// use their -text tokens, which hold on the surface and on the container of a hovered card.
export const INPUT_CARD_COLOR_CLASSES: Record<InputColor, string> = {
    neutral: 'data-[selected=true]:border-on-surface has-focus-visible:outline-primary',
    primary: 'data-[selected=true]:border-primary has-focus-visible:outline-primary',
    secondary: 'data-[selected=true]:border-secondary-text has-focus-visible:outline-secondary-text',
    success: 'data-[selected=true]:border-success-text has-focus-visible:outline-success-text'
};
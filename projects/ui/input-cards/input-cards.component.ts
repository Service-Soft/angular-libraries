import { Component, computed, input, InputSignal, model, ModelSignal, Signal } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { InputCardsAppearance, InputColor, InputFieldComponent, InputSize, InputValidityError } from '@service-soft/ui/input';

import { BaseInputCardsDirective } from './base-input-cards.directive';
import { InputCardContentComponent } from './input-card-content.component';

// a native radio button drawn as a ring: checked, its border grows to a thick ring in the color around the surface,
// which is a shape, and a border, so it survives forced colors mode, where backgrounds are gone. Its own focus ring is
// left out, the card around it shows the focus, also in forced colors mode, which draws outlines in its own color.
// Invalid colors the border, the message below says what is wrong.
const RADIO_CLASSES: string = `
    mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-outline bg-surface transition-colors
    focus-visible:outline-none
    checked:border-[0.375rem]
    disabled:cursor-default
    aria-invalid:border-error
`;

// secondary is too light for the boundary of a control on the surface, so its ring is secondary-text.
const RADIO_COLOR_CLASSES: Record<InputColor, string> = {
    neutral: 'checked:border-on-surface',
    primary: 'checked:border-primary',
    secondary: 'checked:border-secondary-text',
    success: 'checked:border-success'
};

// the segments are one box with the border of a control, as their radio buttons are hidden: in a row once there is
// room for one, below each other where the input is narrow, by its own width. The lines between them are dividers in
// the same color. Invalid colors the border, the message below says what is wrong.
const SEGMENTS_CLASSES: string = `
    flex flex-col divide-y divide-outline overflow-hidden rounded-input-card border border-outline
    @sm:flex-row @sm:divide-x @sm:divide-y-0
    has-aria-invalid:border-error
`;

// the label of a segment is its target, so a click anywhere on it chooses it. The focus ring is inside, the box around
// the segments would cut one outside off. Its icons are sized in em, like in buttons.
const SEGMENT_CLASSES: string = `
    flex min-w-0 flex-1 items-center justify-center gap-2 text-center transition-colors
    [&_svg]:size-[1.25em] [&_svg]:shrink-0
    has-focus-visible:outline-2 has-focus-visible:-outline-offset-4
    data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50
`;

// the heights of buttons and inputs of the same size, so a segmented input lines up with them in a row. A min-h, so a
// label that wraps makes the segment taller instead of overflowing it.
const SEGMENT_SIZE_CLASSES: Record<InputSize, string> = {
    sm: 'min-h-8 px-3 py-1 text-label',
    md: 'min-h-10 px-4 py-2 text-label',
    lg: 'min-h-12 px-5 py-2.5 text-label-lg'
};

// read only, like the other inputs, in the container color, which holds the same texts as the surface.
const SEGMENT_BACKGROUND_CLASSES: Record<'editable' | 'readonly', string> = {
    editable: 'cursor-pointer bg-surface text-on-surface hover:bg-surface-container',
    readonly: 'cursor-default bg-surface-container text-on-surface'
};

// the chosen segment is filled with the color under its on- color, hovering with -hover, like a filled button: checked
// pairs. It has a check mark as well, so it doesn't show by the color alone, also in forced colors mode, where the fill
// is gone. Its focus ring is the on- color, which stands out on the fill. secondary and success are too light for a
// ring on the surface, so the others use their -text tokens there.
const SEGMENT_COLOR_CLASSES: Record<InputColor, string> = {
    neutral: `
        has-focus-visible:outline-primary
        data-[selected=true]:bg-on-surface data-[selected=true]:text-surface
        data-[selected=true]:hover:bg-on-surface-variant
        data-[selected=true]:has-focus-visible:outline-surface
    `,
    primary: `
        has-focus-visible:outline-primary
        data-[selected=true]:bg-primary data-[selected=true]:text-on-primary
        data-[selected=true]:hover:bg-primary-hover
        data-[selected=true]:has-focus-visible:outline-on-primary
    `,
    secondary: `
        has-focus-visible:outline-secondary-text
        data-[selected=true]:bg-secondary data-[selected=true]:text-on-secondary
        data-[selected=true]:hover:bg-secondary-hover
        data-[selected=true]:has-focus-visible:outline-on-secondary
    `,
    success: `
        has-focus-visible:outline-success-text
        data-[selected=true]:bg-success data-[selected=true]:text-on-success
        data-[selected=true]:hover:bg-success-hover
        data-[selected=true]:has-focus-visible:outline-on-success
    `
};

/**
 * An input to choose one of a few options shown as cards, like a car or a plan, with its label, hint and validation
 * error. Each card has a title, and may have a description, an image or an icon, and what `<ng-template
 * uiInputCardMeta>` shows at its end, like a price. Segmented, the options are one row of segments with only their
 * labels and icons instead, for two to five short options, like the size of a shirt. Bind its value two-way with
 * [(value)], which is undefined while nothing is chosen. The options can hold any value, compared by identity.
 * Every card or segment is a label around a native radio button, inside a fieldset whose legend is the label: the
 * browser handles the keyboard, the arrow keys move between the options, and a required one has to be chosen before its
 * form submits.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-cards',
    templateUrl: './input-cards.component.html',
    imports: [InputFieldComponent, InputCardContentComponent, IconComponent],
    host: {
        // a container, which the columns of the cards and the row of the segments follow
        class: '@container flex flex-col'
    }
})
export class InputCardsComponent<T> extends BaseInputCardsDirective<T, T | undefined> {
    /**
     * The value of the chosen option, undefined while none is.
     */
    readonly value: ModelSignal<T | undefined> = model<T>();

    /**
     * Whether the options are cards, or one row of segments with only their labels and icons. The default comes from
     * provideInputConfig.
     */
    readonly appearance: InputSignal<InputCardsAppearance> = input(this.config.cardsAppearance);

    /**
     * Whether the options are segments.
     */
    protected readonly isSegmented: Signal<boolean> = computed(() => this.appearance() === 'segmented');

    /**
     * The tailwind classes of a native radio button of a card.
     */
    protected readonly radioClasses: Signal<string> = computed(() => `${RADIO_CLASSES} ${RADIO_COLOR_CLASSES[this.color()]}`);

    /**
     * The tailwind classes of the box around the segments.
     */
    protected readonly segmentsClasses: string = SEGMENTS_CLASSES;

    /**
     * The tailwind classes of a segment.
     */
    protected readonly segmentClasses: Signal<string> = computed(() => {
        const background: string = SEGMENT_BACKGROUND_CLASSES[this.readonly() ? 'readonly' : 'editable'];
        return `${SEGMENT_CLASSES} ${SEGMENT_SIZE_CLASSES[this.size()]} ${background} ${SEGMENT_COLOR_CLASSES[this.color()]}`;
    });

    /**
     * The mark of the chosen segment.
     */
    protected readonly checkIcon: IconDefinition = faCheck;

    /**
     * The error of the native ValidityState a group of radio buttons can have.
     */
    // the browser checks required for the whole group: every radio button of it is missing a value while none is checked.
    protected readonly validityErrors: readonly InputValidityError[] = ['valueMissing'];

    /**
     * Whether the value of an option is the chosen one.
     * @param value - The value of the option.
     * @returns Whether its card is checked.
     */
    protected isChosen(value: T): boolean {
        return value === this.value();
    }
}
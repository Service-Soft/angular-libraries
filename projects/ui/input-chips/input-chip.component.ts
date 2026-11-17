import { booleanAttribute, Component, computed, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef, Signal } from '@angular/core';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { InputColor, InputSize } from '@service-soft/ui/input';

/**
 * Whether a chip has the button that removes it at its end.
 */
type ChipShape = 'removable' | 'fixed';

// a border, so the chip keeps its shape in forced colors mode, where backgrounds are gone: the line of a neutral one,
// transparent on a tint. The end is as wide as the start unless the button that removes it sits there.
const CHIP_CLASSES: Record<InputColor, Record<ChipShape, string>> = {
    neutral: {
        removable: 'inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container ps-3 pe-1',
        fixed: 'inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container px-3'
    },
    primary: {
        removable: 'inline-flex items-center gap-1 rounded-full border border-transparent bg-primary-tint ps-3 pe-1',
        fixed: 'inline-flex items-center gap-1 rounded-full border border-transparent bg-primary-tint px-3'
    },
    secondary: {
        removable: 'inline-flex items-center gap-1 rounded-full border border-transparent bg-secondary-tint ps-3 pe-1',
        fixed: 'inline-flex items-center gap-1 rounded-full border border-transparent bg-secondary-tint px-3'
    },
    success: {
        removable: 'inline-flex items-center gap-1 rounded-full border border-transparent bg-success-tint ps-3 pe-1',
        fixed: 'inline-flex items-center gap-1 rounded-full border border-transparent bg-success-tint px-3'
    }
};

// a chip fits into the box of its field, which stays as high as the other inputs of its size: the one of a small field
// is just high enough for the button that removes it, a target of 24px.
const CHIP_SIZE_CLASSES: Record<InputSize, string> = {
    sm: 'min-h-6',
    md: 'min-h-8',
    lg: 'min-h-8'
};

// the colored text on its tint, which the theme checks; secondary and success are too light for text, so they use
// their -text tokens.
const LABEL_CLASSES: Record<InputColor, string> = {
    neutral: 'text-label text-on-surface',
    primary: 'text-label text-primary',
    secondary: 'text-label text-secondary-text',
    success: 'text-label text-success-text'
};

// not a ui-button: a text button hovers with the tint of its color, which is the background of the chip already. It
// hovers with the surface, or the pressed tint, which keep the contrast of its icon. At least 24px, like every target.
const REMOVE_BUTTON_CLASSES: Record<InputColor, string> = {
    neutral: `
        inline-flex min-h-6 min-w-6 cursor-pointer items-center justify-center rounded-full text-on-surface-variant
        hover:bg-surface
        focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary
    `,
    primary: `
        inline-flex min-h-6 min-w-6 cursor-pointer items-center justify-center rounded-full text-primary
        hover:bg-primary-tint-pressed
        focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary
    `,
    secondary: `
        inline-flex min-h-6 min-w-6 cursor-pointer items-center justify-center rounded-full text-secondary-text
        hover:bg-secondary-tint-pressed
        focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary-text
    `,
    success: `
        inline-flex min-h-6 min-w-6 cursor-pointer items-center justify-center rounded-full text-success-text
        hover:bg-success-tint-pressed
        focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-success-text
    `
};

/**
 * One chosen value of ui-input-chips: its label and the button that removes it. Internal to the chips input.
 */
@Component({
    // on the li itself, since a list may only hold list items
    selector: 'li[ui-input-chip]',
    templateUrl: './input-chip.component.html',
    imports: [IconComponent],
    host: {
        '[class]': 'classes()'
    }
})
export class InputChipComponent {
    /**
     * What the chip shows.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * The id of the label, which describes the button that removes it.
     */
    readonly labelId: InputSignal<string> = input.required<string>();

    /**
     * Whether the chip can be removed.
     */
    readonly removable: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The color of the chip.
     */
    readonly color: InputSignal<InputColor> = input.required<InputColor>();

    /**
     * The size of the field the chip is in.
     */
    readonly size: InputSignal<InputSize> = input.required<InputSize>();

    /**
     * The name of the button that removes the chip, read together with its label.
     */
    readonly removeLabel: InputSignal<string> = input.required<string>();

    /**
     * Emits when the user removes the chip.
     */
    readonly removed: OutputEmitterRef<void> = output();

    /**
     * The icon of the button that removes the chip.
     */
    protected readonly removeIcon: IconDefinition = faXmark;

    /**
     * The tailwind classes of the chip.
     */
    protected readonly classes: Signal<string> = computed(() => {
        return `${CHIP_CLASSES[this.color()][this.removable() ? 'removable' : 'fixed']} ${CHIP_SIZE_CLASSES[this.size()]}`;
    });

    /**
     * The tailwind classes of the label.
     */
    protected readonly labelClasses: Signal<string> = computed(() => LABEL_CLASSES[this.color()]);

    /**
     * The tailwind classes of the button that removes the chip.
     */
    protected readonly removeButtonClasses: Signal<string> = computed(() => REMOVE_BUTTON_CLASSES[this.color()]);
}
import { booleanAttribute, Component, computed, input, InputSignal, InputSignalWithTransform, model, ModelSignal, Signal } from '@angular/core';
import { BaseInputDirective, InputColor, InputFieldComponent, InputSize, InputValidityError } from '@service-soft/ui/input';

// the track takes the row next to the value, and is as high as the smallest target allowed. The focus ring is offset
// from it, so it never depends on its color. While invalid, the slider itself turns error instead of getting a box
// around it; the error message below is the cue that doesn't rely on color. The aria-invalid variant is more specific
// than the accent of the color, so it wins regardless of the order in the stylesheet.
const SLIDER_CLASSES: string = `
    h-6 min-w-0 grow cursor-pointer
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
    disabled:cursor-default disabled:opacity-50
    aria-invalid:accent-error
`;

// the browser draws the filled part of the track and the thumb in the accent color. The thumb is the boundary of the
// control, which secondary is too light for on the surface, so it uses secondary-text.
const ACCENT_CLASSES: Record<InputColor, string> = {
    neutral: 'accent-on-surface',
    primary: 'accent-primary',
    secondary: 'accent-secondary-text',
    success: 'accent-success'
};

// as high as the box of another input of the same size, so the track lines up with the middle of the inputs next to it.
const ROW_CLASSES: Record<InputSize, string> = {
    sm: 'flex min-h-8 items-center gap-3',
    md: 'flex min-h-10 items-center gap-3',
    lg: 'flex min-h-12 items-center gap-3'
};

/**
 * A slider for a number within a range, like a volume or a rating, with its label, the current number next to it, and
 * a hint and validation error below. It is the native range input of the browser, which handles its keyboard.
 * Bind its value two-way with [(value)]. Unlike other inputs it always holds a number, by default the middle of the
 * range, so it is never missing.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-slider',
    templateUrl: './input-slider.component.html',
    imports: [InputFieldComponent],
    host: {
        class: 'flex flex-col'
    }
})
export class InputSliderComponent extends BaseInputDirective<number> {
    /**
     * The number of the slider.
     */
    readonly value: ModelSignal<number> = model(50);

    /**
     * Whether its label is marked as required. Not by default: a slider always holds a number, so it is never missing.
     */
    override readonly required: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The smallest number, like the native min.
     */
    readonly min: InputSignal<number> = input(0);

    /**
     * The largest number, like the native max.
     */
    readonly max: InputSignal<number> = input(100);

    /**
     * The steps the number moves in, counted from min, like the native step.
     */
    readonly step: InputSignal<number> = input(1);

    /**
     * The color of the filled part of the track and the thumb. The default comes from provideInputConfig.
     */
    readonly color: InputSignal<InputColor> = input(this.config.color);

    /**
     * The tailwind classes of the native range input.
     */
    protected readonly sliderClasses: Signal<string> = computed(() => `${SLIDER_CLASSES} ${ACCENT_CLASSES[this.color()]}`);

    /**
     * The tailwind classes of the row of the track and the number, for the current size.
     */
    protected readonly rowClasses: Signal<string> = computed(() => ROW_CLASSES[this.size()]);

    // the browser keeps the value within min and max and on a step, so only customValidation can make it invalid.
    /**
     * The errors of the native ValidityState a slider can have: none.
     */
    protected readonly validityErrors: readonly InputValidityError[] = [];

    /**
     * Takes the number the user moved the slider to as the value.
     * @param slider - The native range input.
     */
    protected updateValue(slider: HTMLInputElement): void {
        this.value.set(slider.valueAsNumber);
    }
}
import { booleanAttribute, Component, computed, input, InputSignal, InputSignalWithTransform, model, ModelSignal, Signal } from '@angular/core';
import { faCheck, faMinus } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { BaseInputDirective, INPUT_CHECKBOX_CLASSES, INPUT_CHECKBOX_COLOR_CLASSES, INPUT_CHECKBOX_MARK_CLASSES, INPUT_CHECKBOX_MARK_COLOR_CLASSES, INPUT_SWITCH_CLASSES, INPUT_SWITCH_COLOR_CLASSES, INPUT_SWITCH_THUMB_CLASSES, InputBooleanAppearance, InputColor, InputFieldComponent, InputValidityError } from '@service-soft/ui/input';

// the box and the track of INPUT_CHECKBOX_CLASSES and INPUT_SWITCH_CLASSES stand alone here, not in a card, so they show
// the focus themselves, offset, so it never depends on their color, and hover with the variant of the text. Invalid
// colors the border, the message below says what is wrong.
const STANDALONE_CLASSES: string = `
    hover:border-on-surface-variant
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
    disabled:opacity-50
    aria-invalid:hover:border-error
`;

// the mark and the thumb fade with a disabled checkbox.
const DISABLED_PEER_CLASSES: string = 'peer-disabled:opacity-50';

/**
 * An input for a yes or no, like accepting the terms or turning on notifications, with its label after it and a hint
 * and validation error below. A checkbox by default, or a switch for a setting that applies right away.
 * Bind its value two-way with [(value)]. It is a native checkbox, so the browser handles its keyboard and state, and a
 * required one has to be checked before its form submits. Without a label, its content is the label, which can hold
 * links, like a checkbox that accepts the privacy policy.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-boolean',
    templateUrl: './input-boolean.component.html',
    imports: [InputFieldComponent, IconComponent],
    host: {
        class: 'flex flex-col'
    }
})
export class InputBooleanComponent extends BaseInputDirective<boolean> {
    /**
     * Whether it is checked.
     */
    readonly value: ModelSignal<boolean> = model(false);

    /**
     * What it is for, shown after it and read by screen readers. Leave it out to make the content of the component the
     * label, like `I accept the <a ui-link href="/privacy">privacy policy</a>`.
     */
    override readonly label: InputSignal<string> = input('');

    /**
     * Whether it has to be checked, like accepting the terms. Unlike other inputs not by default: a no is a value.
     */
    override readonly required: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether it is a checkbox, or a switch for a setting that applies right away. The default comes from
     * provideInputConfig.
     */
    readonly appearance: InputSignal<InputBooleanAppearance> = input(this.config.booleanAppearance);

    /**
     * Whether a checkbox shows as partly checked, like one that checks a group of which only some are. A click checks
     * or unchecks it as usual; the consumer then sets it from the group again. A switch is never partly on.
     */
    readonly indeterminate: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether it sits in a row next to inputs with their label above them, like in a grid of a form. It then keeps the
     * space of such a label above it, so it lines up with their boxes rather than with their labels.
     */
    readonly alignWithInputs: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether it is a switch.
     */
    protected readonly isSwitch: Signal<boolean> = computed(() => this.appearance() === 'switch');

    /**
     * Whether the native checkbox is partly checked, which a switch never is.
     */
    protected readonly nativeIndeterminate: Signal<boolean> = computed(() => this.indeterminate() && !this.isSwitch());

    /**
     * The color of a checked checkbox or switch. The default comes from provideInputConfig.
     */
    readonly color: InputSignal<InputColor> = input(this.config.color);

    /**
     * The tailwind classes of the native checkbox.
     */
    protected readonly checkboxClasses: Signal<string> = computed(() => this.isSwitch()
        ? `${INPUT_SWITCH_CLASSES} ${STANDALONE_CLASSES} ${INPUT_SWITCH_COLOR_CLASSES[this.color()]}`
        : `${INPUT_CHECKBOX_CLASSES} ${STANDALONE_CLASSES} ${INPUT_CHECKBOX_COLOR_CLASSES[this.color()]}`);

    /**
     * The tailwind classes of the thumb of a switch.
     */
    protected readonly thumbClasses: Signal<string> = computed(
        () => `${INPUT_SWITCH_THUMB_CLASSES[this.color()]} ${DISABLED_PEER_CLASSES}`
    );

    /**
     * The tailwind classes of the marks of a checkbox.
     */
    protected readonly markClasses: Signal<Record<'checked' | 'indeterminate', string>> = computed(() => {
        const color: string = `${INPUT_CHECKBOX_MARK_COLOR_CLASSES[this.color()]} ${DISABLED_PEER_CLASSES}`;
        return {
            checked: `${INPUT_CHECKBOX_MARK_CLASSES.checked} ${color}`,
            indeterminate: `${INPUT_CHECKBOX_MARK_CLASSES.indeterminate} ${color}`
        };
    });

    /**
     * The mark of a checked checkbox.
     */
    protected readonly checkIcon: IconDefinition = faCheck;

    /**
     * The mark of a partly checked checkbox.
     */
    protected readonly indeterminateIcon: IconDefinition = faMinus;

    /**
     * The error of the native ValidityState a checkbox can have.
     */
    protected readonly validityErrors: readonly InputValidityError[] = ['valueMissing'];

    /**
     * Keeps the value while read only.
     * @param event - The click of the native checkbox, also from the keyboard.
     */
    // a native checkbox ignores readonly. Preventing the click keeps it focusable and submitted, which disabled doesn't.
    protected preventWhileReadonly(event: Event): void {
        if (this.readonly()) {
            event.preventDefault();
        }
    }
}
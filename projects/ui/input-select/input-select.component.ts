import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { Component, computed, input, InputSignal, model, ModelSignal, Signal, viewChild } from '@angular/core';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { BaseInputDirective, INPUT_OPTION_CLASSES, INPUT_POPUP_CLASSES, InputFieldComponent, InputOption, InputPopupDirective, InputSize, InputValidityError } from '@service-soft/ui/input';

// A div has no disabled state of its own, the combobox sets aria-disabled, and a read only one can't be opened. A group,
// so the chevron can follow aria-expanded.
const COMBOBOX_CLASSES: string = `
    group relative flex cursor-pointer items-center
    aria-disabled:pointer-events-none aria-disabled:opacity-50
    aria-readonly:cursor-default
`;

// room for the chevron at the end: the padding of the size on both sides of it, so a small select stays small.
const COMBOBOX_SIZE_CLASSES: Record<InputSize, string> = {
    sm: 'pe-8',
    md: 'pe-10',
    lg: 'pe-12'
};

const CHOSEN_LABEL_CLASSES: Record<'chosen' | 'placeholder', string> = {
    chosen: 'truncate',
    placeholder: 'truncate text-on-surface-variant'
};

// points up while the list is open. Turning is movement, so it only animates with motion-safe.
const CHEVRON_CLASSES: Record<InputSize, string> = {
    sm: `
        pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-on-surface-variant
        group-aria-expanded:rotate-180
        motion-safe:transition-transform
    `,
    md: `
        pointer-events-none absolute inset-y-0 end-3 flex items-center text-on-surface-variant
        group-aria-expanded:rotate-180
        motion-safe:transition-transform
    `,
    lg: `
        pointer-events-none absolute inset-y-0 end-4 flex items-center text-on-surface-variant
        group-aria-expanded:rotate-180
        motion-safe:transition-transform
    `
};

/**
 * A select to choose one of a few options, like a country or a status, with its label, hint and validation error.
 * Bind its value two-way with [(value)], which is undefined while nothing is chosen. The options can hold any value,
 * like an enum or an object, compared by identity. Its list is styled like the one of the autocomplete. A native
 * select underneath is what the browser validates, submits and autofills, so a form only submits when it is valid. The
 * error shows once the user left it or tried to submit its form, or when showValidationError is set to true.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-select',
    templateUrl: './input-select.component.html',
    imports: [InputFieldComponent, InputPopupDirective, IconComponent, Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option],
    host: {
        class: 'flex flex-col'
    }
})
export class InputSelectComponent<T> extends BaseInputDirective<T | undefined, HTMLSelectElement> {
    /**
     * The value of the chosen option, undefined while none is.
     */
    readonly value: ModelSignal<T | undefined> = model<T>();

    /**
     * The options to choose from, in the order they show.
     */
    readonly options: InputSignal<InputOption<T>[]> = input.required<InputOption<T>[]>();

    private readonly combobox: Signal<Combobox> = viewChild.required(Combobox);

    /**
     * The index of the chosen option, -1 for none.
     */
    protected readonly selectedIndex: Signal<number> = computed(() => {
        const value: T | undefined = this.value();
        return this.options().findIndex(option => option.value === value);
    });

    /**
     * The label of the chosen option, undefined while none is.
     */
    protected readonly chosenLabel: Signal<string | undefined> = computed(() => this.options()[this.selectedIndex()]?.label);

    /**
     * The tailwind classes of the label of the chosen option, or of the placeholder.
     */
    protected readonly chosenLabelClasses: Signal<string> = computed(
        () => CHOSEN_LABEL_CLASSES[this.chosenLabel() == undefined ? 'placeholder' : 'chosen']
    );

    /**
     * The chosen values, as the listbox takes them. The empty option of an optional select is chosen while nothing else is.
     */
    protected readonly selectedValues: Signal<(T | undefined)[]> = computed(() => {
        if (this.selectedIndex() !== -1) {
            return [this.value()];
        }
        return this.required() ? [] : [undefined];
    });

    /**
     * The tailwind classes of the list.
     */
    protected readonly popupClasses: string = INPUT_POPUP_CLASSES;

    /**
     * The tailwind classes of an option.
     */
    protected readonly optionClasses: string = INPUT_OPTION_CLASSES;

    /**
     * The tailwind classes around the chevron at the end, for the current size.
     */
    protected readonly chevronClasses: Signal<string> = computed(() => CHEVRON_CLASSES[this.size()]);

    /**
     * The chevron that says the select opens a list.
     */
    protected readonly chevronIcon: IconDefinition = faChevronDown;

    /**
     * The errors of the native ValidityState a select can have.
     */
    protected readonly validityErrors: readonly InputValidityError[] = ['valueMissing'];

    /**
     * Whether an option of the native select can't be chosen: when it says so, and every option but the chosen one while
     * read only.
     * @param option - The option.
     * @param index - Its index.
     * @returns Whether it is disabled.
     */
    // a native select ignores readonly. Disabling the other options keeps the value an autofill would change, while the
    // select is still submitted, which a disabled one isn't.
    protected isOptionDisabled(option: InputOption<T>, index: number): boolean {
        return option.disabled === true || (this.readonly() && index !== this.selectedIndex());
    }

    /**
     * Takes the option the browser chose in the native select, like when it autofills it, as the value.
     * @param select - The native select.
     */
    protected updateValue(select: HTMLSelectElement): void {
        // the value of an option is its index, the empty option has none
        this.value.set(select.value === '' ? undefined : this.options()[Number(select.value)]?.value);
    }

    /**
     * Takes the option the user chose in the list as the value, and closes the list.
     * @param values - The chosen values of the listbox.
     */
    protected choose(values: (T | undefined)[]): void {
        // Enter or a click on the chosen option deselects it in the listbox, which for a select only confirms it. The bound
        // values are always options, so the listbox never empties them on its own.
        if (values.length) {
            this.value.set(values[0]);
        }
        this.combobox().expanded.set(false);
        this.showValidationError.set(true);
    }

    /**
     * Resolves the classes of the combobox, which looks like an input and opens a list on click like a button.
     * @returns The tailwind classes.
     */
    protected override resolveExtraClasses(): string {
        return `${COMBOBOX_CLASSES} ${COMBOBOX_SIZE_CLASSES[this.size()]}`;
    }
}
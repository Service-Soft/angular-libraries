import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { afterRenderEffect, booleanAttribute, Component, computed, effect, input, InputSignal, InputSignalWithTransform, model, ModelSignal, Signal, untracked, viewChild } from '@angular/core';
import { BaseInputDirective, INPUT_OPTION_CLASSES, INPUT_POPUP_CLASSES, InputFieldComponent, InputOption, InputPopupDirective, InputValidityError } from '@service-soft/ui/input';

/**
 * An input to choose one of many options by typing, like a city or a customer, with its label, hint and validation
 * error. The options that contain the text show in a list below it, which the arrow keys move through and Enter
 * chooses, and only an option can be the value.
 * Bind its value two-way with [(value)], which is undefined while no option is chosen, and the text with [(query)], to
 * load the options that fit it from a backend.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-autocomplete',
    templateUrl: './input-autocomplete.component.html',
    imports: [InputFieldComponent, InputPopupDirective, Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option],
    host: {
        class: 'flex flex-col'
    }
})
export class InputAutocompleteComponent<T> extends BaseInputDirective<T | undefined> {
    /**
     * The value of the chosen option, undefined while none is.
     */
    readonly value: ModelSignal<T | undefined> = model<T>();

    /**
     * The options to choose from. The ones whose label contains the text show.
     */
    readonly options: InputSignal<InputOption<T>[]> = input.required<InputOption<T>[]>();

    /**
     * The text of the input: what the user typed, or the label of the chosen option.
     */
    readonly query: ModelSignal<string> = model('');

    /**
     * Whether any text is fine and the options only suggest some, like the cities typed before. Bind the text with
     * [(query)] as the value then: value is only set while the text is an option.
     */
    readonly freeText: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    // whether the list is open is the combobox's own state: a binding of it only reaches the combobox when the bound
    // value changes, and the combobox opens itself on every keystroke.
    private readonly combobox: Signal<Combobox> = viewChild.required(Combobox);

    /**
     * The options whose label contains the text, ignoring the case.
     */
    protected readonly shownOptions: Signal<InputOption<T>[]> = computed(() => {
        const typed: string = this.query();
        const query: string = typed.trim().toLowerCase();
        // the text of a chosen option shows every option, so the list offers to choose another one
        const options: InputOption<T>[] = this.options();
        return query === '' || this.isChosenLabel(query) ? options : options.filter(option => option.label.toLowerCase().includes(query));
    });

    /**
     * The chosen values, as the listbox takes them.
     */
    protected readonly selectedValues: Signal<T[]> = computed(() => {
        const value: T | undefined = this.value();
        return value === undefined ? [] : [value];
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
     * The errors of the native ValidityState the input can have.
     */
    protected readonly validityErrors: readonly InputValidityError[] = ['valueMissing'];

    constructor() {
        super();
        // the combobox opens the list on every keystroke, also for a text no option contains, which would show an empty
        // box and tell screen readers a list is there
        effect(() => {
            const combobox: Combobox = this.combobox();
            if (combobox.expanded() && !this.shownOptions().length) {
                combobox.expanded.set(false);
            }
        });
        // the options of a backend arrive after the keystroke that asked for them, for which the combobox already opened
        // the list and the effect above closed it again, as nothing fit yet. Only new options open it, so Escape still
        // closes it while the user types.
        effect(() => {
            const options: InputOption<T>[] = this.options();
            untracked(() => {
                const input: HTMLInputElement = this.nativeInput().nativeElement;
                const query: string = this.query().trim()
                    .toLowerCase();
                const searching: boolean = input.ownerDocument.activeElement === input && query !== '' && !this.isChosenLabel(query);
                if (options.length && searching && this.shownOptions().length) {
                    this.combobox().expanded.set(true);
                }
            });
        });
        // a value set from code shows its label
        effect(() => {
            const label: string | undefined = this.findLabel(this.value());
            if (label != undefined && untracked(() => this.query()) !== label) {
                this.query.set(label);
            }
        });
        // the combobox reads what the user types, but never writes the text itself, and owns the value input of the
        // element, so a [value] binding wouldn't reach it either.
        afterRenderEffect({
            write: () => {
                const query: string = this.query();
                const input: HTMLInputElement = this.nativeInput().nativeElement;
                if (input.value !== query) {
                    input.value = query;
                }
            }
        });
    }

    /**
     * Resolves whether the text is an option, unless any text is fine, then the custom validation.
     * @returns The message, or undefined when the text is empty or the label of the chosen option.
     */
    protected override resolveCustomError(): string | undefined {
        const query: string = this.query();
        return !this.freeText() && query !== '' && query !== this.findLabel(this.value())
            ? this.config.errorMessages.optionNotChosen
            : super.resolveCustomError();
    }

    /**
     * Takes what the user typed as the text. It is no option anymore, so the value is gone until they choose one.
     * @param query - The text.
     */
    protected updateQuery(query: string): void {
        this.query.set(query);
        if (query !== this.findLabel(this.value())) {
            this.value.set(undefined);
        }
    }

    /**
     * Takes the option the user chose as the value, its label as the text, and closes the list.
     * @param values - The chosen values of the listbox.
     */
    protected choose(values: T[]): void {
        if (!values.length) {
            return;
        }
        const value: T | undefined = values[0];
        this.value.set(value);
        this.query.set(this.findLabel(value) ?? '');
        this.combobox().expanded.set(false);
        this.showValidationError.set(true);
    }

    private findLabel(value: T | undefined): string | undefined {
        return value === undefined ? undefined : this.options().find(option => option.value === value)?.label;
    }

    private isChosenLabel(query: string): boolean {
        const label: string | undefined = this.findLabel(this.value());
        return query === label?.toLowerCase();
    }
}
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { afterRenderEffect, Component, computed, effect, input, InputSignal, model, ModelSignal, Signal, viewChild } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { BaseInputDirective, INPUT_OPTION_CLASSES, INPUT_POPUP_CLASSES, InputColor, InputFieldComponent, InputOption, InputPopupDirective, InputSize, InputValidityError } from '@service-soft/ui/input';

import { InputChipView } from './input-chip-view.model';
import { InputChipComponent } from './input-chip.component';

// the look of the native input of the other controls, on the box that holds the chips and the text: the input inside is
// only where the text goes. The focus ring shows while the text is focused, not while a button of a chip is, which has a
// ring of its own. Invalid and disabled are states of the input, which the box reads with has-.
const BOX_CLASSES: string = `
    flex w-full flex-wrap items-center gap-1.5 rounded-input border border-outline text-body text-on-surface transition
    hover:border-on-surface-variant
    has-[input:focus]:outline-2 has-[input:focus]:-outline-offset-1 has-[input:focus]:outline-primary
    has-disabled:pointer-events-none has-disabled:opacity-50
    has-aria-invalid:border-error
    has-aria-invalid:hover:border-error
    has-aria-invalid:has-[input:focus]:outline-error
`;

// by the readonly input, like the other controls.
const BOX_BACKGROUND_CLASSES: Record<'editable' | 'readonly', string> = {
    editable: 'bg-surface',
    readonly: 'bg-surface-container'
};

// as high as the other inputs of the size, also with a line of chips, which are sized to fit it, with less padding than
// theirs: the text inside has its own.
const BOX_SIZE_CLASSES: Record<InputSize, string> = {
    sm: 'min-h-8 px-1 py-0',
    md: 'min-h-10 px-1.5 py-0.5',
    lg: 'min-h-12 px-2.5 py-1.5'
};

// takes the rest of the line after the chips, and a line of its own once it has less than room for a few letters. Its
// outline is hidden, the box shows the focus; hidden rather than none, so forced colors mode still draws it.
const TEXT_CLASSES: string = `
    min-w-[8ch] flex-1 bg-transparent px-1.5 text-body text-on-surface outline-hidden
    placeholder:text-on-surface-variant
`;

/**
 * Turns a text the user typed into a value, like a new tag, or returns undefined when it is none, which keeps the text in
 * the input.
 */
export type InputChipsCustomValue<T> = (text: string) => T | undefined;

/**
 * An input to choose several values, like the tags of an article or the members of a team, each shown as a chip that
 * removes it. Typing shows the options that contain the text in a list below it, which the arrow keys move through and
 * Enter selects or deselects, with its label, hint and validation error.
 * Bind its value two-way with [(value)]. With customValue, Enter also takes a text that is no option, like a new tag.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-chips',
    templateUrl: './input-chips.component.html',
    imports: [
        InputFieldComponent,
        InputChipComponent,
        InputPopupDirective,
        IconComponent,
        Combobox,
        ComboboxPopup,
        ComboboxWidget,
        Listbox,
        Option
    ],
    host: {
        class: 'flex flex-col'
    }
})
export class InputChipsComponent<T> extends BaseInputDirective<T[]> {
    /**
     * The chosen values, in the order they were chosen.
     */
    readonly value: ModelSignal<T[]> = model<T[]>([]);

    /**
     * The options to choose from. The ones whose label contains the text show.
     */
    readonly options: InputSignal<InputOption<T>[]> = input<InputOption<T>[]>([]);

    /**
     * Turns a text that is no option into a value when the user presses Enter, like a new tag. Without it, only options
     * can be chosen.
     */
    readonly customValue: InputSignal<InputChipsCustomValue<T> | undefined> = input<InputChipsCustomValue<T>>();

    /**
     * The text of the input, bind it with [(query)] to load the options that fit it from a backend.
     */
    readonly query: ModelSignal<string> = model('');

    /**
     * The color of the chips.
     */
    readonly color: InputSignal<InputColor> = input<InputColor>(this.config.color);

    // whether the list is open is the combobox's own state: a binding of it only reaches the combobox when the bound
    // value changes, and the combobox opens itself on every keystroke.
    private readonly combobox: Signal<Combobox> = viewChild.required(Combobox);

    /**
     * The options whose label contains the text, ignoring the case.
     */
    protected readonly shownOptions: Signal<InputOption<T>[]> = computed(() => {
        const typed: string = this.query();
        const query: string = typed.trim().toLowerCase();
        return this.options().filter(option => option.label.toLowerCase().includes(query));
    });

    /**
     * The chosen values among the shown options, which is all the listbox knows of: it drops a value it has no option
     * for, which would deselect every value the text hides.
     */
    protected readonly shownValues: Signal<T[]> = computed(() => {
        const shown: Set<T> = new Set(this.shownOptions().map(option => option.value));
        return this.value().filter(value => shown.has(value));
    });

    /**
     * Whether the list shows, which needs an option to show.
     */
    protected readonly isOpen: Signal<boolean> = computed(() => this.combobox().expanded() && this.shownOptions().length > 0);

    /**
     * The chosen values as their chips show them.
     */
    protected readonly chips: Signal<InputChipView<T>[]> = computed(() => this.value().map((value, index) => ({
        value,
        label: this.findLabel(value),
        labelId: `${this.inputId()}-chip-${index}`
    })));

    /**
     * Whether values can be chosen and removed.
     */
    protected readonly isEditable: Signal<boolean> = computed(() => !this.disabled() && !this.readonly());

    /**
     * The name of the buttons that remove a chip, read together with its label.
     */
    protected readonly removeLabel: string = this.config.removeLabel;

    /**
     * The tailwind classes of the box around the chips and the text.
     */
    protected readonly boxClasses: Signal<string> = computed(() => {
        const background: string = BOX_BACKGROUND_CLASSES[this.readonly() ? 'readonly' : 'editable'];
        return `${BOX_CLASSES} ${background} ${BOX_SIZE_CLASSES[this.size()]}`;
    });

    /**
     * The tailwind classes of the native input, which only holds the text.
     */
    protected readonly textClasses: string = TEXT_CLASSES;

    /**
     * The tailwind classes of the list.
     */
    protected readonly popupClasses: string = INPUT_POPUP_CLASSES;

    /**
     * The tailwind classes of an option.
     */
    protected readonly optionClasses: string = INPUT_OPTION_CLASSES;

    /**
     * The mark of a chosen option.
     */
    protected readonly checkIcon: IconDefinition = faCheck;

    // the native input only holds the text being typed, so it checks nothing itself: required is the custom error.
    /**
     * The errors of the native ValidityState the input checks: none.
     */
    protected readonly validityErrors: readonly InputValidityError[] = [];

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
     * Resolves whether a value is missing, then the custom validation.
     * @returns The message, or undefined when the values meet the rules.
     */
    protected override resolveCustomError(): string | undefined {
        return this.required() && !this.value().length ? this.config.errorMessages.valueMissing : super.resolveCustomError();
    }

    /**
     * Takes the values the user selected and deselected in the list, keeping the ones the text hides, and empties the text for
     * the next one. The list stays open, to choose more.
     * @param values - The chosen values among the shown options, as the listbox has them.
     */
    protected choose(values: T[]): void {
        // the listbox says what it was given as well, once its list opens, which chose nothing
        const before: T[] = this.shownValues();
        if (values.length === before.length && values.every(value => before.includes(value))) {
            return;
        }
        const current: T[] = this.value();
        const deselected: T[] = before.filter(value => !values.includes(value));
        const added: T[] = values.filter(value => !current.includes(value));
        this.value.set([...current.filter(value => !deselected.includes(value)), ...added]);
        this.query.set('');
        this.showValidationError.set(true);
    }

    /**
     * Takes a text that is no option as a value, when Enter is pressed while the list shows nothing to choose.
     * @param event - The keydown of Enter.
     */
    // while the list is open, Enter chooses its active option, which the combobox handles.
    protected addCustomValue(event: Event): void {
        const customValue: InputChipsCustomValue<T> | undefined = this.customValue();
        const text: string = this.query().trim();
        if (customValue == undefined || this.isOpen() || text === '') {
            return;
        }
        // Enter would submit the form otherwise
        event.preventDefault();
        const value: T | undefined = customValue(text);
        // a text that is no value stays, so the user can correct it, and the error of customValidation says why
        if (value === undefined) {
            this.showValidationError.set(true);
            return;
        }
        if (!this.value().includes(value)) {
            this.value.update(values => [...values, value]);
        }
        this.query.set('');
        this.showValidationError.set(true);
    }

    // the button that was clicked goes with its chip, and the focus would be lost with it. The text next to the chips takes
    // it, where the user goes on.
    /**
     * Removes a chosen value with the button of its chip, and focuses the text.
     * @param index - The index of the value.
     */
    protected removeValue(index: number): void {
        this.value.update(values => values.filter((_, i) => i !== index));
        this.showValidationError.set(true);
        this.focus();
    }

    /**
     * Removes the last chosen value, when Backspace is pressed in the empty text, like it deletes the letter before it.
     */
    protected removeLastValue(): void {
        if (this.query() !== '' || !this.isEditable() || !this.value().length) {
            return;
        }
        this.value.update(values => values.slice(0, -1));
        this.showValidationError.set(true);
    }

    // the label of its option, or the value itself for one that was typed.
    private findLabel(value: T): string {
        return this.options().find(option => option.value === value)?.label ?? String(value);
    }
}